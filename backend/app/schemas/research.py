from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SummaryRead(BaseModel):
    id: str
    document_id: str
    abstract: Optional[str] = None
    objectives: Optional[str] = None
    methodology: Optional[str] = None
    dataset: Optional[str] = None
    results: Optional[str] = None
    limitations: Optional[str] = None
    conclusion: Optional[str] = None
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SummarizeRequest(BaseModel):
    document_id: str
    force_regenerate: bool = False


class SummaryResponse(BaseModel):
    document_id: str
    summary: SummaryRead


class CompareRequest(BaseModel):
    document_ids: List[str] = Field(..., min_length=2, max_length=5)


class PaperComparisonItem(BaseModel):
    document_id: str
    title: str
    objectives: str
    methodology: str
    dataset: str
    results: str
    limitations: str


class ComparisonResponse(BaseModel):
    comparison_summary: str
    key_differences: List[str]
    synthesis_observations: List[str]
    papers: List[PaperComparisonItem]


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=2000)
    document_ids: Optional[List[str]] = Field(default_factory=list)
    limit: int = Field(default=5, ge=1, le=50)


class PassageResult(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    chunk_id: str
    snippet: str
    similarity_score: float
