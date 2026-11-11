import logging
from typing import List
import numpy as np
from app.core.config import settings

logger = logging.getLogger("papermind.embedder")


class EmbeddingEngine:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingEngine, cls).__new__(cls)
        return cls._instance

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer embedding model: {settings.EMBEDDING_MODEL_NAME}...")
                self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer ({e}). Using deterministic embedding fallback.")
                self._model = "fallback"
        return self._model

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Compute normalized dense embedding vectors (384-dim) for a list of text strings.
        """
        if not texts:
            return []

        model = self._get_model()
        if model != "fallback":
            try:
                # normalize_embeddings=True calculates L2 unit vectors for Cosine distance
                embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
                return [arr.tolist() for arr in embeddings]
            except Exception as e:
                logger.error(f"Error encoding texts with SentenceTransformer: {e}")

        # Deterministic normalized fallback vector generation
        results = []
        for text in texts:
            vec = self._deterministic_vector(text)
            results.append(vec)
        return results

    def embed_query(self, query: str) -> List[float]:
        """Compute embedding vector for a single search query."""
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * settings.EMBEDDING_DIMENSION

    def _deterministic_vector(self, text: str) -> List[float]:
        """Generate deterministic 384-dim vector for testing/offline fallback."""
        import hashlib
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(settings.EMBEDDING_DIMENSION)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()


embedding_engine = EmbeddingEngine()
