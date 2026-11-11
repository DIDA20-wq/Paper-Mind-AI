import logging
import uuid
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("papermind.qdrant")


class QdrantService:
    def __init__(self):
        self.client = None
        self.collection_name = settings.QDRANT_COLLECTION
        self._init_client()

    def _init_client(self):
        """
        Initialize Qdrant client. First tries remote host/port if configured,
        then falls back to embedded on-disk database, and finally in-memory.
        """
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models

            # Try connecting to remote Qdrant if running
            try:
                client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, timeout=2.0)
                client.get_collections()
                self.client = client
                logger.info(f"Connected to remote Qdrant server at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
            except Exception:
                # Fallback to local on-disk embedded Qdrant
                logger.info(f"Remote Qdrant not detected. Using embedded Qdrant at: {settings.QDRANT_PATH}")
                self.client = QdrantClient(path=settings.QDRANT_PATH)

            self._ensure_collection()
        except Exception as e:
            logger.warning(f"Failed to initialize QdrantClient ({e}). Using in-memory fallback.")
            try:
                from qdrant_client import QdrantClient
                self.client = QdrantClient(":memory:")
                self._ensure_collection()
            except Exception as e_mem:
                logger.error(f"In-memory Qdrant also failed: {e_mem}")
                self.client = None

    def _ensure_collection(self):
        if not self.client:
            return

        from qdrant_client.http import models

        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            logger.info(f"Creating Qdrant collection: {self.collection_name} (dim: {settings.EMBEDDING_DIMENSION}, Cosine)")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=models.Distance.COSINE
                )
            )

            # Create payload indexes for fast filtering
            for field in ["document_id", "user_id", "page_number"]:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field,
                        field_schema=models.PayloadSchemaType.KEYWORD if field != "page_number" else models.PayloadSchemaType.INTEGER
                    )
                except Exception as e:
                    logger.debug(f"Payload index creation for {field}: {e}")

    def upsert_chunks(
        self,
        document_id: str,
        user_id: str,
        title: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> bool:
        """
        Store embedded document chunks with full metadata into Qdrant.
        """
        if not self.client or len(chunks) != len(embeddings):
            return False

        from qdrant_client.http import models

        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk["chunk_id"]))
            payload = {
                "chunk_id": chunk["chunk_id"],
                "document_id": document_id,
                "user_id": user_id,
                "title": title,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "char_start": chunk.get("char_start", 0),
                "char_end": chunk.get("char_end", len(chunk["text"])),
            }
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
            )

        # Batch upsert points
        batch_size = 100
        for b_start in range(0, len(points), batch_size):
            batch = points[b_start:b_start + batch_size]
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch
            )

        logger.info(f"Upserted {len(points)} vector points for document {document_id} into Qdrant.")
        return True

    def delete_document_chunks(self, document_id: str, user_id: str) -> bool:
        """
        Delete all vector points belonging to a specific document and user.
        """
        if not self.client:
            return False

        from qdrant_client.http import models

        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",
                                match=models.MatchValue(value=document_id)
                            ),
                            models.FieldCondition(
                                key="user_id",
                                match=models.MatchValue(value=user_id)
                            ),
                        ]
                    )
                )
            )
            logger.info(f"Deleted vector chunks for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks from Qdrant: {e}")
            return False

    def search(
        self,
        query_vector: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        limit: int = 6,
        score_threshold: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Execute filtered vector similarity search in Qdrant.
        Strictly enforces user isolation and optional document filtering.
        """
        if not self.client:
            return []

        from qdrant_client.http import models

        # Build filter conditions
        must_conditions = [
            models.FieldCondition(
                key="user_id",
                match=models.MatchValue(value=user_id)
            )
        ]

        if document_ids:
            if len(document_ids) == 1:
                must_conditions.append(
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=document_ids[0])
                    )
                )
            else:
                must_conditions.append(
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchAny(any=document_ids)
                    )
                )

        search_filter = models.Filter(must=must_conditions)

        try:
            # Modern qdrant-client >= 1.10 uses query_points
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    query_filter=search_filter,
                    limit=limit,
                    score_threshold=score_threshold
                )
                results = response.points
            else:
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=search_filter,
                    limit=limit,
                    score_threshold=score_threshold
                )

            passages = []
            for hit in results:
                passages.append({
                    "chunk_id": hit.payload.get("chunk_id"),
                    "document_id": hit.payload.get("document_id"),
                    "document_title": hit.payload.get("title", "Untitled Document"),
                    "page_number": hit.payload.get("page_number", 1),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "snippet": hit.payload.get("text", ""),
                    "similarity_score": round(float(hit.score), 4),
                })

            return passages
        except Exception as e:
            logger.error(f"Error performing vector search in Qdrant: {e}")
            return []


qdrant_service = QdrantService()
