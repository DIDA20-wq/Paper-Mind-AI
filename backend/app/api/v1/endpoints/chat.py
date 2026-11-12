import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession, Message
from app.models.citation import Citation
from app.schemas.chat import (
    ChatSessionRead,
    ChatSessionDetail,
    ChatSessionCreate,
    ChatSessionUpdate,
    AskQuestionRequest,
    ChatResponse,
    CitationRead,
)
from app.rag.engine import rag_engine

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def ask_question(
    req: AskQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    RAG Question-Answering Endpoint:
    1. Resolve or create chat session.
    2. Save user question message.
    3. Retrieve relevant vector passages from Qdrant.
    4. Generate grounded answer with verifiable page citations.
    5. Save assistant message and citations in PostgreSQL.
    6. Return answer and citations.
    """
    # 1. Resolve Session
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    target_doc_id = req.document_id
    doc_ids = list(req.document_ids) if req.document_ids else []
    if target_doc_id and target_doc_id not in doc_ids:
        doc_ids.append(target_doc_id)

    had_doc_ids_requested = bool(doc_ids)

    # Validate that all requested document IDs belong to the current user (defense in depth)
    if doc_ids:
        valid_docs = db.query(Document.id).filter(
            Document.id.in_(doc_ids),
            Document.user_id == current_user.id
        ).all()
        doc_ids = [vd[0] for vd in valid_docs]

        # If user explicitly requested documents but NONE belong to them, ensure no fallback to all papers
        if had_doc_ids_requested and not doc_ids:
            doc_ids = ["00000000-0000-0000-0000-000000000000"]

    if not session:
        # Generate informative title from question
        short_title = req.question[:60] + "..." if len(req.question) > 60 else req.question
        session = ChatSession(
            user_id=current_user.id,
            title=short_title,
            document_id=target_doc_id,
            is_multi_doc=len(doc_ids) > 1
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 2. Record User Message
    user_msg = Message(
        session_id=session.id,
        sender="user",
        content=req.question,
    )
    db.add(user_msg)
    db.commit()

    # 3. Execute Grounded RAG Pipeline
    rag_result = rag_engine.answer_question(
        question=req.question,
        user_id=current_user.id,
        document_ids=doc_ids,
        limit=6
    )

    # 4. Record Assistant Message
    assistant_msg = Message(
        session_id=session.id,
        sender="assistant",
        content=rag_result["answer"],
        response_time_ms=rag_result["response_time_ms"],
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # 5. Record Citations in PostgreSQL
    saved_citations = []
    for c in rag_result["citations"]:
        citation_rec = Citation(
            message_id=assistant_msg.id,
            document_id=c["document_id"],
            page_number=c["page_number"],
            chunk_id=c["chunk_id"],
            snippet=c["snippet"],
            similarity_score=c["similarity_score"]
        )
        db.add(citation_rec)
        db.flush()

        saved_citations.append(CitationRead(
            id=citation_rec.id,
            document_id=c["document_id"],
            document_title=c.get("document_title"),
            page_number=c["page_number"],
            chunk_id=c["chunk_id"],
            snippet=c["snippet"],
            similarity_score=c["similarity_score"]
        ))

    db.commit()

    return ChatResponse(
        session_id=session.id,
        message_id=assistant_msg.id,
        answer=rag_result["answer"],
        citations=saved_citations,
        response_time_ms=rag_result["response_time_ms"]
    )


@router.get("/sessions", response_model=List[ChatSessionRead])
def list_chat_sessions(
    document_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve chat sessions for the current user."""
    query = db.query(ChatSession).filter(ChatSession.user_id == current_user.id)
    if document_id:
        doc = db.query(Document.id).filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        ).first()
        if not doc:
            return []
        query = query.filter(ChatSession.document_id == document_id)
    
    return query.order_by(ChatSession.updated_at.desc()).all()


@router.post("/sessions", response_model=ChatSessionRead, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_in: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat conversation session."""
    if session_in.document_id:
        doc = db.query(Document.id).filter(
            Document.id == session_in.document_id,
            Document.user_id == current_user.id
        ).first()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced document not found")

    session = ChatSession(
        user_id=current_user.id,
        title=session_in.title,
        document_id=session_in.document_id,
        is_multi_doc=session_in.is_multi_doc
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch session history including messages and citations."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=ChatSessionRead)
def update_chat_session(
    session_id: str,
    session_in: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update chat conversation title."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    session.title = session_in.title.strip()
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chat session and all its associated messages and citations."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    db.delete(session)
    db.commit()
    return {"success": True, "message": "Chat session deleted successfully"}


@router.get("/sessions/{session_id}/export")
def export_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export chat conversation and verifiable citations as a formatted Markdown research document."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    doc_title = session.document.title if session.document else "Multi-Paper Research Session"
    md_lines = [
        f"# Research Session: {session.title}",
        f"**Date:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"**Primary Scope:** {doc_title}",
        f"**Multi-Paper Query:** {'Yes' if session.is_multi_doc else 'No'}",
        "\n---\n",
        "## Conversation Transcript\n"
    ]

    for idx, msg in enumerate(session.messages, start=1):
        sender_label = "Researcher (User)" if msg.sender == "user" else "PaperMind AI Assistant"
        md_lines.append(f"### {idx}. {sender_label}")
        md_lines.append(f"{msg.content}\n")

        if msg.citations:
            md_lines.append("#### Verifiable Citations:")
            for cit in msg.citations:
                c_doc = cit.document.title if cit.document else "Document"
                md_lines.append(
                    f"- **Source:** {c_doc} | **Page:** {cit.page_number} | **Similarity:** {cit.similarity_score:.4f}\n"
                    f"  > \"{cit.snippet}\"\n"
                )
        md_lines.append("\n---\n")

    full_markdown = "\n".join(md_lines)
    safe_title = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in session.title)[:40]
    filename = f"PaperMind_Chat_{safe_title}.md"

    return {
        "session_id": session.id,
        "title": session.title,
        "filename": filename,
        "markdown": full_markdown
    }
