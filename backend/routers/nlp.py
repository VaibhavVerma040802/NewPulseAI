from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from core.database import get_db
from services.nlp_pipeline import NLPPipeline
from core.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/nlp", tags=["nlp"])

@router.post("/process/{article_id}")
def process_article(
    article_id: UUID, 
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user) # Secure it when ready
):
    """
    Manually trigger the Gemini NLP pipeline to process an article 
    (generate summary, extract sentiment, and extract entities).
    """
    pipeline = NLPPipeline(db)
    success = pipeline.process_article(str(article_id))
    
    if success:
        return {"message": f"Successfully processed article {article_id}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to process article")
