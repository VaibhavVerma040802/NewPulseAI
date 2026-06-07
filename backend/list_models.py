import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from core.config import get_settings
import google.generativeai as genai
import random

def list_models():
    settings = get_settings()
    keys = settings.get_gemini_keys()
    if not keys:
        print("No API keys found")
        return
        
    api_key = keys[0]
    print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")
    
    genai.configure(api_key=api_key)
    
    try:
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
