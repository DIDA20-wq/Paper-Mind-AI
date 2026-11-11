import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.rag.embedder import embedding_engine
from app.services.qdrant_service import qdrant_service
from app.services.gemini_service import gemini_service
from app.rag.prompts import construct_rag_prompt

logger = logging.getLogger("papermind.rag_engine")


class RAGEngine:
    def answer_question(
        self,
        question: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        limit: int = 6
    ) -> Dict[str, Any]:
        """
        Execute grounded RAG workflow:
        1. Embed question.
        2. Filtered top-K vector retrieval in Qdrant.
        3. Factual verification / sufficient context check.
        4. Strict grounding generation via Gemini.
        5. Citation resolution.
        """
        start_time = time.perf_counter()

        # Clean document_ids list
        active_doc_ids = [d for d in (document_ids or []) if d]

        # 1. Embed query
        query_vector = embedding_engine.embed_query(question)

        # 2. Retrieve relevant passages from Qdrant
        passages = qdrant_service.search(
            query_vector=query_vector,
            user_id=user_id,
            document_ids=active_doc_ids if active_doc_ids else None,
            limit=limit,
            score_threshold=0.15
        )

        # 3. Check evidence sufficiency
        if not passages:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "answer": "Based on the uploaded research paper(s), there is insufficient evidence to answer this question.",
                "citations": [],
                "response_time_ms": elapsed_ms,
                "passages": []
            }

        # 4. Construct grounded prompt & invoke Gemini
        prompt = construct_rag_prompt(question, passages)
        answer = gemini_service.generate_answer(prompt, passages)

        # 5. Build structured citation records
        citations = []
        for p in passages:
            citations.append({
                "document_id": p["document_id"],
                "document_title": p.get("document_title", "Untitled Document"),
                "page_number": p["page_number"],
                "chunk_id": p["chunk_id"],
                "snippet": p["snippet"],
                "similarity_score": p["similarity_score"]
            })

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "answer": answer,
            "citations": citations,
            "response_time_ms": elapsed_ms,
            "passages": passages
        }


rag_engine = RAGEngine()
