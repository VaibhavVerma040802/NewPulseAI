from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.chat import ChatMessage, ChatResponse
from services.rag_chatbot import RAGChatbot

router = APIRouter(prefix="/chat", tags=["chat"])

# We can instantiate it once, but we'll instantiate per request for simplicity
# or use a dependency.
def get_chatbot():
    return RAGChatbot()

@router.post("", response_model=ChatResponse)
def chat_with_bot(
    message: ChatMessage,
    chatbot: RAGChatbot = Depends(get_chatbot)
):
    """
    Send a message to the NewsPulse AI chatbot and receive an answer
    grounded in the stored articles.
    """
    if not message.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    response = chatbot.chat(message.message, session_id=message.session_id)
    return response
