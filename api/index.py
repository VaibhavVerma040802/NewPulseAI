import sys
import os

# Add the backend folder to the python path so imports resolve correctly
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the FastAPI app instance from backend/main.py
from backend.main import app
