from fastapi import APIRouter, Header, HTTPException, status
import logging
from core.scheduler import fetch_and_process_news
from core.config import get_settings

router = APIRouter(prefix="/cron", tags=["Cron"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.get("/fetch-news")
async def trigger_fetch_news(authorization: str = Header(None)):
    """
    Endpoint intended to be triggered by Vercel Cron.
    In Vercel, the authorization header is passed as 'Bearer <CRON_SECRET>'.
    Since Vercel automatically checks the CRON_SECRET if properly configured,
    we can allow the request, or we can enforce a custom secret.
    """
    # For extra security, Vercel provides CRON_SECRET env variable.
    import os
    expected_secret = os.environ.get("CRON_SECRET")
    
    if expected_secret:
        if not authorization or authorization != f"Bearer {expected_secret}":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Cron Secret"
            )

    logger.info("Cron endpoint hit: Triggering news fetch.")
    
    # Run synchronously. In Vercel serverless, returning the response might freeze the environment.
    # Therefore we must AWAIT or run the fetch BEFORE returning the response.
    # fetch_and_process_news is synchronous, so it will block until done, which is what we want on Vercel.
    try:
        fetch_and_process_news()
        return {"status": "success", "message": "News fetched and processed."}
    except Exception as e:
        logger.error(f"Cron fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Error fetching news")
