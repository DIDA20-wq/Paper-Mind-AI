from typing import List, Dict, Any

RAG_SYSTEM_PROMPT = """You are PaperMind AI, an elite academic research assistant and literature synthesis specialist.
Your answers MUST be strictly grounded in the provided research paper passages.

RULES:
1. Grounding: Answer the question using ONLY the factual evidence provided in the context blocks below.
2. In-text Citations: Whenever you cite a claim or finding, append the exact source reference: `[Doc: {document_title}, Page {page_number}]`.
3. Zero-Hallucination Fallback: If the provided passages do NOT contain sufficient information or evidence to answer the question, do NOT invent or extrapolate. State clearly:
   "Based on the uploaded research paper(s), there is insufficient evidence to answer this question."
4. Tone & Style: Be concise, technically precise, objective, and scholarly.
5. Limitations & Gaps: If discussing methodology, findings, or research gaps, cite observed evidence rather than personal opinion.
"""


def format_context_passages(passages: List[Dict[str, Any]]) -> str:
    """Format retrieved Qdrant passages into structured context blocks with explicit document and page metadata."""
    if not passages:
        return "No relevant passages found in the uploaded documents."

    context_blocks = []
    for i, p in enumerate(passages):
        title = p.get("document_title", "Unknown Document")
        page = p.get("page_number", "Unknown")
        snippet = p.get("snippet", "").strip()
        score = p.get("similarity_score", 0.0)

        block = (
            f"--- [Passage {i+1}] ---\n"
            f"Document: {title}\n"
            f"Page Number: {page}\n"
            f"Relevance Score: {score}\n"
            f"Content:\n{snippet}\n"
        )
        context_blocks.append(block)

    return "\n".join(context_blocks)


def construct_rag_prompt(question: str, passages: List[Dict[str, Any]]) -> str:
    context_str = format_context_passages(passages)
    return (
        f"{RAG_SYSTEM_PROMPT}\n\n"
        f"=== CONTEXT PASSAGES FROM UPLOADED PAPERS ===\n"
        f"{context_str}\n\n"
        f"=== RESEARCH QUESTION ===\n"
        f"{question}\n\n"
        f"=== GROUNDED ANSWER (Include in-text citations [Doc: ..., Page ...] or report insufficient evidence) ==="
    )
