# B2C AI Gateway — FastAPI & Document Intelligence Service

Das Modul `03_b2c-ai-gateway` ist ein hochperformanter, asynchroner Microservice auf Basis von **FastAPI** und **Python 3.11+**. Er übernimmt die Extraktion von PDF-Vertragsdokumenten, die Strukturierung mittels Large Language Models (Google Gemini) und die Beantwortung von Nutzerfragen im RAG-Chatbot.

---

## 🛠️ Technologie-Stack

* **Laufzeit & Framework**: Python 3.11+ mit FastAPI und Uvicorn
* **Paket- & Umgebungsmanager**: Astral `uv` für reproduzierbare und extrem schnelle Abhängigkeitsauflösung
* **Dokumenten-Parsing**: PyMuPDF (`fitz`) für native Textextraktion und Layout-Erkennung
* **LLM & Schema-Validierung**: Google Gemini API (`google-genai`, `google-generativeai`) mit `instructor` und Pydantic v2 für garantierte JSON-Schemakonformität
* **Storage-Anbindung**: Boto3 für S3-kompatiblen Object Storage (lokal MinIO, in Produktion Google Cloud Storage)
* **Observability**: Integrierte LLM-Metriken (Latenzen, Token, geschätzte Kosten) und Langfuse-Tracking

---

## 📁 Paket- und Codestruktur

```
03_b2c-ai-gateway/
├── pyproject.toml              # Paket- und Abhängigkeitsdefinition (Hatchling / uv)
├── uv.lock                     # Exakt gepinnte Abhängigkeiten
├── .env.example                # Vorlage für Umgebungsvariablen
├── src/
│   ├── main.py                 # FastAPI App, CORS, Routing & BackgroundTasks
│   ├── models/                 # Pydantic Schemata für Vertragsextraktion & API
│   │   └── contract_schema.py  # Typisiertes Schema (Vertragspartner, Fristen, TCO-Preise)
│   └── services/
│       ├── extractor.py        # PyMuPDF PDF-Text- & Tabellenextraktion
│       ├── orchestrator.py     # End-to-End Analyse-Pipeline & Webhook-Callback
│       ├── chat.py             # RAG-Chatbot Logik für vertragsbezogene Fragen
│       └── s3_client.py        # Download von Verträgen aus MinIO / GCS
└── tests/                      # Pytest Test-Suite für Extraktor, Validierung & Chat
```

---

## 🔌 API-Endpunkte

| Methode | Pfad | Beschreibung | Autorisierung |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Kubernetes Liveness & Readiness Probe | Öffentlich |
| `POST` | `/api/v1/analyze` | Startet asynchrone Vertragsanalyse via BackgroundTasks | Intern (M2M) |
| `POST` | `/api/v1/chat` | RAG-Chatbot für kontextbezogene Vertragsfragen | Intern (M2M) |
| `GET` | `/api/v1/ops/llm-metrics`| Live-Metriken (Token, Latenz, Kosten) für Ops Control Center | Header `X-Ops-Secret` |
| `GET` | `/docs` | OpenAPI / Swagger UI (nur im Entwicklungsmodus aktiv) | Dev-Only |

---

## ⚙️ Konfiguration & Umgebungsvariablen (`.env`)

Kopieren Sie `03_b2c-ai-gateway/.env.example` nach `03_b2c-ai-gateway/.env`:

```ini
# Google Gemini API Key (Erforderlich für LLM-Aufrufe)
GEMINI_API_KEY=your_gemini_api_key_here

# M2M Geheimnisse
INTERNAL_WEBHOOK_SECRET=super-secure-internal-webhook-secret-2026
OPS_CONTROL_SECRET=super-secure-ops-token-2026

# Object Storage (MinIO in lokaler Entwicklung)
S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
STORAGE_BUCKET_NAME=b2c-contracts

# Umgebung
ENV=dev
LOG_LEVEL=INFO
```

---

## 🚀 Lokale Ausführung & Test

### Mit dem zentralen Entwickler-Skript:
```bash
# Ersteinrichtung & uv sync
./devlocal setup

# Alle Services inklusive AI-Gateway starten
./devlocal start

# Tests ausführen
./devlocal test
```

### Manuell mit uv:
```bash
cd 03_b2c-ai-gateway

# Virtuelle Umgebung erstellen und Abhängigkeiten synchronisieren
uv sync

# Gateway auf Port 8000 starten
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Tests ausführen
uv run --package b2c-ai-gateway pytest
```
