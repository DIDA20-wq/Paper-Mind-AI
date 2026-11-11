from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    title: str
    filename: str


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    id: str
    user_id: str
    file_size: int
    file_hash: Optional[str] = None
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    items: List[DocumentRead]
    total: int


class UploadResponse(BaseModel):
    message: str
    document: DocumentRead
