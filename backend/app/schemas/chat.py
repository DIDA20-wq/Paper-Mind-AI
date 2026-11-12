from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CitationRead(BaseModel):
    id: str
    document_id: str
    document_title: Optional[str] = None
    page_number: int
    chunk_id: str
    snippet: str
    similarity_score: float

    model_config = ConfigDict(from_attributes=True)


class MessageRead(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    tokens_used: int
    response_time_ms: float
    created_at: datetime
    citations: List[CitationRead] = []

    model_config = ConfigDict(from_attributes=True)


class ChatSessionBase(BaseModel):
    title: str = "Research Conversation"
    document_id: Optional[str] = None
    is_multi_doc: bool = False


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ChatSessionRead(ChatSessionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionDetail(ChatSessionRead):
    messages: List[MessageRead] = []


class AskQuestionRequest(BaseModel):
    session_id: Optional[str] = None
    document_id: Optional[str] = None
    document_ids: Optional[List[str]] = Field(default_factory=list)
    question: str = Field(..., min_length=2, max_length=4000)


class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    answer: str
    citations: List[CitationRead]
    response_time_ms: float
