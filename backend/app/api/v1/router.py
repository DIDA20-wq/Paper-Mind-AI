from fastapi import APIRouter
from app.api.v1.endpoints import auth, documents, chat, research

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Research Chat"])
api_router.include_router(research.router, prefix="/research", tags=["Research Analysis"])
