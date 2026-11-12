import os
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentRead, DocumentListResponse, UploadResponse
from app.services.pdf_service import pdf_service
from app.rag.chunker import chunker
from app.rag.embedder import embedding_engine
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger("papermind.documents")

router = APIRouter()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete PDF Ingestion Pipeline:
    1. Read and validate file type and size (<=30MB).
    2. Compute SHA-256 hash.
    3. Save PDF to local disk.
    4. Extract text page-by-page preserving original 1-indexed page numbers using PyMuPDF.
    5. Split into overlapping chunks preserving exact page boundaries.
    6. Generate dense vector embeddings with SentenceTransformers.
    7. Store vectors and metadata payloads into Qdrant vector database.
    8. Save document record in PostgreSQL.
    """
    # 1. Read file bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to read file: {e}")

    # 2. Validate PDF format and size
    is_valid, error_msg = pdf_service.validate_pdf(contents, max_size_mb=settings.MAX_UPLOAD_SIZE_MB)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # 3. Compute hash and generate file path
    import re
    file_hash = pdf_service.compute_sha256(contents)
    doc_id = str(uuid.uuid4())
    raw_filename = os.path.basename(file.filename or "paper.pdf")
    sanitized_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_filename)
    safe_filename = f"{doc_id}_{sanitized_filename}"
    stored_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(stored_path, "wb") as f:
        f.write(contents)

    # 4. Extract text page by page with PyMuPDF
    try:
        pages_data = pdf_service.extract_text_by_page(contents)
        page_count = len(pages_data)
        title = pdf_service.extract_document_title(pages_data, fallback_filename=file.filename)
    except Exception as e:
        logger.error(f"PyMuPDF extraction failed for {file.filename}: {e}")
        # Clean up file
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"PDF extraction error: {e}")

    # 5. Overlapping chunking preserving exact page numbers
    chunks = chunker.chunk_document(document_id=doc_id, pages_data=pages_data)
    chunk_count = len(chunks)

    # 6. Generate vector embeddings (384-dim, normalized)
    chunk_texts = [c["text"] for c in chunks]
    embeddings = embedding_engine.embed_texts(chunk_texts)

    # 7. Store embeddings and payload in Qdrant
    qdrant_success = qdrant_service.upsert_chunks(
        document_id=doc_id,
        user_id=current_user.id,
        title=title,
        chunks=chunks,
        embeddings=embeddings
    )

    doc_status = DocumentStatus.INDEXED.value if qdrant_success else DocumentStatus.ERROR.value
    err_message = None if qdrant_success else "Vector indexing failed"

    # 8. Persist document metadata in PostgreSQL
    new_doc = Document(
        id=doc_id,
        user_id=current_user.id,
        title=title,
        filename=file.filename,
        file_path=stored_path,
        file_size=len(contents),
        file_hash=file_hash,
        page_count=page_count,
        chunk_count=chunk_count,
        status=doc_status,
        error_message=err_message,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    logger.info(f"Document '{title}' ({page_count} pages, {chunk_count} chunks) ingested successfully for user {current_user.email}.")

    return {
        "message": "Research paper successfully ingested, parsed, and indexed in Qdrant.",
        "document": new_doc
    }


@router.get("", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve list of documents owned by the active user."""
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))
    
    total = query.count()
    items = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total}


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch details of a specific document owned by the user."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document, purge vectors from Qdrant, and delete physical file."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # 1. Purge points from Qdrant vector database
    qdrant_service.delete_document_chunks(document_id=document_id, user_id=current_user.id)

    # 2. Remove physical file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Failed to delete file on disk: {e}")

    # 3. Cascade delete database records
    db.delete(doc)
    db.commit()

    return {"success": True, "message": "Document and vector index deleted successfully"}
