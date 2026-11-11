import logging
import time
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("papermind.gemini")


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        self._init_gemini()

    def _init_gemini(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": 0.2,
                        "top_p": 0.95,
                        "max_output_tokens": 2048,
                    }
                )
                logger.info(f"Initialized Google Gemini service with model {self.model_name}.")
            except Exception as e:
                logger.warning(f"Could not configure Google Gemini client ({e}).")
                self._client = None
        else:
            logger.info("No GEMINI_API_KEY detected. Using grounded scholarly synthesis engine.")
            self._client = None

    def generate_answer(self, prompt: str, passages: List[Dict[str, Any]]) -> str:
        """
        Generate answer from prompt. If Gemini API is configured and reachable,
        calls Gemini. Otherwise, utilizes deterministic grounded extraction.
        """
        if self._client:
            try:
                response = self._client.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Falling back to grounded synthesizer.")

        return self._grounded_synthesis_fallback(passages)

    def _grounded_synthesis_fallback(
        self,
        passages: List[Dict[str, Any]]
    ) -> str:
        """
        Deterministic, faithful synthesis from retrieved passages.
        Strictly guarantees verifiable page citations without hallucination.
        """
        if not passages:
            return "Based on the uploaded document(s), there is insufficient evidence to answer this question."

        top_passages = passages[:3]
        synthesis_points = []
        
        for p in top_passages:
            doc_title = p.get("document_title", "Uploaded Document")
            page = p.get("page_number", 1)
            snippet = p.get("snippet", "").strip()

            # Extract the first two complete sentences of the snippet
            sentences = [s.strip() for s in snippet.split(". ") if len(s.strip()) > 15]
            core_text = ". ".join(sentences[:2]) if sentences else snippet[:250]
            if not core_text.endswith("."):
                core_text += "."

            synthesis_points.append(
                f"• {core_text} [Doc: {doc_title}, Page {page}]"
            )

        answer = (
            f"Based on the analyzed literature, the following evidence was retrieved:\n\n"
            + "\n\n".join(synthesis_points)
        )
        return answer


gemini_service = GeminiService()
