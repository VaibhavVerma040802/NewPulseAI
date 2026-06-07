import uuid
import logging
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from core.config import get_settings
from services.vector_store import VectorStoreService
from schemas.chat import ChatResponse, ArticleCitation

logger = logging.getLogger(__name__)
settings = get_settings()

class RAGChatbot:
    def __init__(self):
        import random
        self.vector_store = VectorStoreService()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=random.choice(settings.get_gemini_keys()),
            temperature=0.3
        )
        
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""
            You are NewsPulse AI, a powerful and intelligent assistant.
            You have access to a database of recent news articles. First, try to answer the user's question using the provided Context if it is relevant.
            If the provided context does NOT contain the answer, you are fully authorized to answer the question using your own general world knowledge, just like Gemini or ChatGPT would.
            Always be helpful, informative, and clear.

            Context:
            {context}

            Question: {question}

            Answer:
            """
        )

    def chat(self, user_message: str, session_id: str = None) -> ChatResponse:
        """Processes a chat message using RAG."""
        if not session_id:
            session_id = str(uuid.uuid4())
            
        logger.info(f"Processing chat for session {session_id}: {user_message}")
        
        # 1. Retrieve relevant articles
        search_results = self.vector_store.similarity_search(user_message, k=4)
        
        # 2. Format context and citations
        context_parts = []
        citations = []
        
        for idx, res in enumerate(search_results):
            meta = res["metadata"]
            context_parts.append(f"Article {idx + 1}:\nTitle: {meta.get('title')}\nSource: {meta.get('source')}\nContent: {res['content']}\n")
            
            citations.append(ArticleCitation(
                article_id=meta.get("article_id", ""),
                title=meta.get("title", ""),
                source=meta.get("source", ""),
                relevance_score=float(res["score"]) # L2 distance or cosine depending on pgvector config
            ))
            
        context = "\n---\n".join(context_parts)
        
        # 3. Generate response using Gemini
        formatted_prompt = self.prompt_template.format(context=context, question=user_message)
        
        try:
            ai_message = self.llm.invoke(formatted_prompt)
            reply_text = ai_message.content
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            reply_text = "I'm sorry, but I encountered an error while trying to process your request."

        return ChatResponse(
            reply=reply_text,
            citations=citations,
            session_id=session_id
        )
