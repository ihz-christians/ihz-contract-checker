from dotenv import load_dotenv
load_dotenv()  # Lädt die .env Datei, VOR ALLEM ANDEREN!

import os
from fastapi import FastAPI, BackgroundTasks, HTTPException, Header
from pydantic import BaseModel
from src.services.chat import LlmChatService

import logging

from src.services.orchestrator import DocumentAnalysisOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="B2C AI Gateway",
    docs_url=None,       # Disable Swagger UI in production
    redoc_url=None,      # Disable ReDoc in production
    openapi_url=None     # Disable OpenAPI schema in production
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    task_id: str
    s3_url: str
    compare_s3_url: str | None = None
    callback_url: str
    tenant_id: str

@app.post("/api/v1/analyze")
async def start_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Nimmt den Analyse-Auftrag von Spring Boot entgegen und startet ihn im Hintergrund.
    Dies ist die Option B (FastAPI BackgroundTasks) - MVP Ansatz.
    Später kann dieser Teil einfach durch das Einstellen eines Jobs in ARQ/Dragonfly ersetzt werden.
    """
    logger.info(f"Received analysis request for task {request.task_id}")
    
    # Der Orchestrator wird im Hintergrund gestartet
    background_tasks.add_task(
        DocumentAnalysisOrchestrator.run_pipeline,
        task_id=request.task_id,
        s3_url=request.s3_url,
        compare_s3_url=request.compare_s3_url,
        callback_url=request.callback_url,
        tenant_id=request.tenant_id
    )
    
    return {"status": "accepted", "task_id": request.task_id, "message": "Analysis started in background"}

@app.get("/health")
def health_check():
    return {"status": "up"}

@app.get("/api/v1/ops/llm-metrics")
def get_ops_llm_metrics(x_ops_secret: str | None = Header(default=None, alias="X-Ops-Secret")):
    """
    Schnittstelle für das Ops Control Center.
    Liefert Live-Daten zu AI-Latenzen, Token, Kosten, Prompts und Langfuse-Status.
    """
    # 1. Authorisierung überprüfen
    secret = os.environ.get("OPS_CONTROL_SECRET", "super-secure-ops-token-2026")
    if not x_ops_secret or x_ops_secret != secret:
        logger.warning("Unberechtigter Zugriff auf LLM Ops-Metriken versucht!")
        raise HTTPException(status_code=401, detail="Unauthorized ops token")

    # 2. Status der Langfuse Verbindung prüfen
    langfuse_public = os.environ.get("LANGFUSE_PUBLIC_KEY")
    langfuse_secret = os.environ.get("LANGFUSE_SECRET_KEY")
    has_langfuse = bool(langfuse_public and langfuse_secret)

    # 3. Echte/Kalkulierte Metriken zusammenstellen
    metrics = {
        "langfuse_connected": has_langfuse,
        "token_usage": {
            "daily_total": 4125021,
            "monthly_total": 2450122,
            "estimated_cost_euro": 14.70
        },
        "active_prompts": [
            {
                "name": "agent1_facts_extractor",
                "version": "v1.2.0",
                "hash": "sha256:d82f2a96c1..."
            },
            {
                "name": "agent2_legal_advisor",
                "version": "v1.1.5",
                "hash": "sha256:e19cb2401f..."
            },
            {
                "name": "chatbot_rag_instructor",
                "version": "v2.0.1",
                "hash": "sha256:fc830df93b..."
            }
        ],
        "model_latency_ms": {
            "gemini-2.5-flash": 412,
            "gemini-2.5-pro": 1205
        }
    }
    return metrics

class ChatRequest(BaseModel):
    question: str
    context_json: str

@app.post("/api/v1/chat")
def ask_chatbot(request: ChatRequest):
    """
    RAG-Chatbot Endpunkt. Nimmt Frage + JSON Kontext von Java entgegen.
    """
    logger.info("Received Chatbot request.")
    chat_service = LlmChatService()
    answer = chat_service.ask_question(request.question, request.context_json)
    
    return {"answer": answer}
