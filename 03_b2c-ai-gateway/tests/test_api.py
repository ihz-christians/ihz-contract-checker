import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "up"}

def test_ops_llm_metrics_unauthorized():
    # 1. No secret header
    response = client.get("/api/v1/ops/llm-metrics")
    assert response.status_code == 401
    assert "detail" in response.json()

    # 2. Wrong secret header
    response = client.get("/api/v1/ops/llm-metrics", headers={"X-Ops-Secret": "wrong-secret"})
    assert response.status_code == 401
    assert "detail" in response.json()

def test_ops_llm_metrics_authorized(monkeypatch):
    # Mock environment variable for OPS secret
    monkeypatch.setenv("OPS_CONTROL_SECRET", "super-secure-ops-token-2026")
    
    response = client.get(
        "/api/v1/ops/llm-metrics", 
        headers={"X-Ops-Secret": "super-secure-ops-token-2026"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "langfuse_connected" in data
    assert "token_usage" in data
    assert "active_prompts" in data
    assert "model_latency_ms" in data
