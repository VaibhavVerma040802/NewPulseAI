from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessage(BaseModel):
    message: str = Field(..., description="The user's input message")
    session_id: Optional[str] = Field(None, description="Optional session ID to maintain conversation history")

class ArticleCitation(BaseModel):
    article_id: str
    title: str
    source: str
    relevance_score: float

class ChatResponse(BaseModel):
    reply: str = Field(..., description="The assistant's generated response")
    citations: List[ArticleCitation] = Field(default_factory=list, description="Articles referenced to generate the answer")
    session_id: str = Field(..., description="The current session ID")
