import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from llm_client import get_llm_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# Load environment variables from the monorepo root .env
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
    logger.info(f"Loaded environment from: {root_env}")
else:
    load_dotenv()
    logger.warn("Root .env not found, using local environment variables.")

app = FastAPI(title="Sinnar Municipality AI Verification Service", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For simplicity in MVP development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComplaintRequest(BaseModel):
    title: str
    description: str
    category: str
    file_urls: list = []

@app.get("/")
def read_root():
    provider = os.getenv("AI_PROVIDER", "mock")
    return {
        "status": "OK",
        "service": "ai-service",
        "configured_provider": provider
    }

@app.post("/api/ai/verify-complaint")
def verify_complaint(req: ComplaintRequest):
    provider = os.getenv("AI_PROVIDER", "mock")
    config = {
        "OLLAMA_URL": os.getenv("OLLAMA_URL", "http://localhost:11434"),
        "OLLAMA_MODEL": os.getenv("OLLAMA_MODEL", "qwen"),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
    }
    
    logger.info(f"Received verification request for category: {req.category} using provider: {provider}")
    
    try:
        client = get_llm_client(provider, config)
        result = client.verify_complaint(
            title=req.title,
            description=req.description,
            category=req.category,
            file_urls=req.file_urls
        )
        return result
    except Exception as e:
        logger.error(f"Error in verification handler: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    logger.info(f"Starting FastAPI server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
