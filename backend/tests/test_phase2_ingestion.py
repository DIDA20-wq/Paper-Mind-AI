import io
import fitz
import pytest
from app.services.pdf_service import pdf_service
from app.rag.chunker import PagePreservingChunker
from app.rag.embedder import embedding_engine
from app.services.qdrant_service import qdrant_service


@pytest.fixture
def sample_pdf_bytes():
    """Create a minimal 3-page synthetic research paper in memory using PyMuPDF."""
    doc = fitz.open()
    
    # Page 1
    page1 = doc.new_page()
    page1.insert_text(
        (50, 72),
        "Attention Is All You Need\n\nAbstract\nThe dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and entirely relying on an attention mechanism to draw global dependencies between input and output."
    )
    
    # Page 2
    page2 = doc.new_page()
    page2.insert_text(
        (50, 72),
        "Model Architecture\n\nThe Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions."
    )
    
    # Page 3
    page3 = doc.new_page()
    page3.insert_text(
        (50, 72),
        "Results and Benchmarks\n\nOn the WMT 2014 English-to-German translation task, the big transformer model achieves a BLEU score of 28.4. On the English-to-French task, our model establishes a new single-model state-of-the-art BLEU score of 41.8."
    )
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_pdf_validation(sample_pdf_bytes):
    # Valid PDF
    is_valid, err = pdf_service.validate_pdf(sample_pdf_bytes, max_size_mb=30)
    assert is_valid is True
    assert err == ""

    # Invalid bytes
    is_valid_fake, err_fake = pdf_service.validate_pdf(b"Not a PDF document", max_size_mb=30)
    assert is_valid_fake is False
    assert "Invalid file format" in err_fake


def test_page_accurate_extraction(sample_pdf_bytes):
    pages = pdf_service.extract_text_by_page(sample_pdf_bytes)
    assert len(pages) == 3

    # Check 1-indexed page numbering
    assert pages[0]["page_number"] == 1
    assert "Attention Is All You Need" in pages[0]["text"]
    assert pages[1]["page_number"] == 2
    assert "Model Architecture" in pages[1]["text"]
    assert pages[2]["page_number"] == 3
    assert "Results and Benchmarks" in pages[2]["text"]


def test_page_preserving_chunking(sample_pdf_bytes):
    pages = pdf_service.extract_text_by_page(sample_pdf_bytes)
    chunker = PagePreservingChunker(chunk_size=200, chunk_overlap=50)
    
    doc_id = "test-doc-123"
    chunks = chunker.chunk_document(document_id=doc_id, pages_data=pages)

    assert len(chunks) >= 3
    for chunk in chunks:
        # Verify chunk identifier format
        assert chunk["chunk_id"].startswith(f"{doc_id}#p")
        # Verify valid page numbers 1, 2, or 3
        assert chunk["page_number"] in [1, 2, 3]
        assert len(chunk["text"]) > 0


def test_embedding_generation():
    texts = [
        "Self-attention mechanism in the Transformer architecture.",
        "Convolutional neural networks for computer vision."
    ]
    embeddings = embedding_engine.embed_texts(texts)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 384
    assert len(embeddings[1]) == 384


def test_qdrant_vector_upsert_and_search():
    user_id = "test-user-456"
    doc_id = "test-doc-789"
    title = "Transformers in Deep Learning"
    
    chunks = [
        {
            "chunk_id": f"{doc_id}#p1#c0",
            "page_number": 1,
            "chunk_index": 0,
            "text": "The Transformer uses multi-head attention without recurrent layers.",
        },
        {
            "chunk_id": f"{doc_id}#p2#c1",
            "page_number": 2,
            "chunk_index": 1,
            "text": "Training was conducted on eight NVIDIA P100 GPUs for 3.5 days.",
        }
    ]
    
    embeddings = embedding_engine.embed_texts([c["text"] for c in chunks])
    
    # 1. Upsert
    success = qdrant_service.upsert_chunks(
        document_id=doc_id,
        user_id=user_id,
        title=title,
        chunks=chunks,
        embeddings=embeddings
    )
    assert success is True

    # 2. Query search
    query = "How does multi-head attention work?"
    query_vector = embedding_engine.embed_query(query)
    results = qdrant_service.search(
        query_vector=query_vector,
        user_id=user_id,
        document_ids=[doc_id],
        limit=5,
        score_threshold=0.0
    )
    assert len(results) > 0
    assert results[0]["document_id"] == doc_id
    assert results[0]["page_number"] in [1, 2]

    # 3. Cleanup
    delete_success = qdrant_service.delete_document_chunks(document_id=doc_id, user_id=user_id)
    assert delete_success is True
