import pytest
from app.rag.engine import rag_engine
from app.services.qdrant_service import qdrant_service
from app.rag.embedder import embedding_engine


def test_rag_zero_hallucination_insufficient_context():
    """Verify that when no evidence is found in uploaded papers, the RAG engine explicitly reports insufficient evidence."""
    user_id = "test-user-isolated-1"
    
    # Query for something completely unrelated to any paper
    result = rag_engine.answer_question(
        question="What is the recipe for baking chocolate chip cookies in an oven?",
        user_id=user_id,
        document_ids=["non-existent-doc-id"],
        limit=5
    )
    
    assert "insufficient evidence" in result["answer"].lower()
    assert result["citations"] == []
    assert result["response_time_ms"] >= 0


def test_rag_grounded_answer_with_citations():
    """Verify that when relevant chunks exist in Qdrant, grounded answers and citations are returned."""
    user_id = "test-user-rag-2"
    doc_id = "test-paper-attention-99"
    title = "Attention Is All You Need"

    chunks = [
        {
            "chunk_id": f"{doc_id}#p4#c0",
            "page_number": 4,
            "chunk_index": 0,
            "text": "Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions.",
        },
        {
            "chunk_id": f"{doc_id}#p8#c1",
            "page_number": 8,
            "chunk_index": 1,
            "text": "On the WMT 2014 English-to-German translation task, the Transformer achieved a 28.4 BLEU score.",
        }
    ]

    embeddings = embedding_engine.embed_texts([c["text"] for c in chunks])
    qdrant_service.upsert_chunks(
        document_id=doc_id,
        user_id=user_id,
        title=title,
        chunks=chunks,
        embeddings=embeddings
    )

    try:
        # Ask question about attention
        result = rag_engine.answer_question(
            question="What is the benefit of Multi-Head Attention?",
            user_id=user_id,
            document_ids=[doc_id],
            limit=4
        )

        assert len(result["citations"]) > 0
        citation = result["citations"][0]
        assert citation["document_id"] == doc_id
        assert citation["page_number"] in [4, 8]
        assert citation["similarity_score"] > 0
        assert "Multi-Head Attention" in result["answer"] or "subspaces" in result["answer"]
    finally:
        qdrant_service.delete_document_chunks(document_id=doc_id, user_id=user_id)
