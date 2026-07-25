#!/bin/bash

# ==============================================================================
# B2C Contract Checker - Local Development Startup Script
# ==============================================================================

# Beende das Skript bei kritischen Fehlern
set -e

# Wechsle absolut sicher in das Verzeichnis, in dem dieses Skript liegt (01_b2c_module)
# Dadurch kann das Skript von überall ausgeführt werden, ohne dass Pfade kaputtgehen!
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Farben für hübschen Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==============================================================================
# TEST LOGIC (Wird von 'test' und 'run-ci-local' verwendet)
# ==============================================================================
run_tests() {
    echo -e "${BLUE}🧪 Starte automatisierte Tests (Java & Python) in einer sauberen Umgebung...${NC}\n"

    # 1. Java Spring Boot Tests
    echo -e "${YELLOW}☕ Führe Java Spring Boot Tests aus...${NC}"
    cd "$ROOT_DIR/02_b2c-contractchecker-spring"
    if ./mvnw clean test; then
        echo -e "${GREEN}✅ Java Tests erfolgreich abgeschlossen.${NC}\n"
    else
        echo -e "${RED}❌ Java Tests fehlgeschlagen!${NC}\n"
        exit 1
    fi

    # 2. Python FastAPI / AI Gateway Tests
    echo -e "${YELLOW}🐍 Führe Python (AI Gateway) Tests aus...${NC}"
    cd "$ROOT_DIR/03_b2c-ai-gateway"
    
    if command -v uv >/dev/null 2>&1; then
        echo -e "Nutze 'uv' für Python Tests..."
        if uv run pytest; then
            echo -e "${GREEN}✅ Python Tests erfolgreich abgeschlossen.${NC}\n"
        else
            echo -e "${RED}❌ Python Tests fehlgeschlagen!${NC}\n"
            exit 1
        fi
    elif [ -f .venv/bin/pytest ]; then
        echo -e "Nutze lokale virtuelle Umgebung (.venv/bin/pytest)..."
        if PYTHONPATH=. .venv/bin/python -m pytest; then
            echo -e "${GREEN}✅ Python Tests erfolgreich abgeschlossen.${NC}\n"
        else
            echo -e "${RED}❌ Python Tests fehlgeschlagen!${NC}\n"
            exit 1
        fi
    else
        echo -e "Nutze Standard 'pip' und 'pytest' (Erstelle virtuelles Environment)..."
        python3 -m venv venv
        source venv/bin/activate
        pip install pytest pytest-asyncio fastapi uvicorn pydantic httpx google-genai instructor pymupdf docling boto3 python-dotenv langfuse faker > /dev/null
        if PYTHONPATH=. pytest; then
            echo -e "${GREEN}✅ Python Tests erfolgreich abgeschlossen.${NC}\n"
            deactivate
        else
            echo -e "${RED}❌ Python Tests fehlgeschlagen!${NC}\n"
            deactivate
            exit 1
        fi
    fi
}

# ==============================================================================
# CLI PARAMETER AUSWERTUNG
# ==============================================================================
if [ "$1" = "test" ]; then
    run_tests
    echo -e "${GREEN}🎉 Alle Tests (Java & Python) wurden erfolgreich bestanden!${NC}"
    exit 0
elif [ "$1" = "run-ci-local" ]; then
    echo -e "${BLUE}🏗️  Starte lokalen CI/CD Simulationslauf (run-ci-local)...${NC}\n"
    
    run_tests

    echo -e "${YELLOW}🐳 Simuliere Docker Build (Backend, AI Gateway, OpsControl)...${NC}"
    cd "$ROOT_DIR"
    
    echo -e "   -> Baue Backend Image..."
    if docker build --target backend -t b2c-backend-local:latest . > /dev/null; then
        echo -e "${GREEN}   ✅ Backend Docker Build erfolgreich.${NC}"
    else
        echo -e "${RED}❌ Backend Docker Build fehlgeschlagen!${NC}"
        exit 1
    fi
    
    echo -e "   -> Baue AI Gateway Image..."
    if docker build --target aigateway -t b2c-aigateway-local:latest . > /dev/null; then
        echo -e "${GREEN}   ✅ AI Gateway Docker Build erfolgreich.${NC}"
    else
        echo -e "${RED}❌ AI Gateway Docker Build fehlgeschlagen!${NC}"
        exit 1
    fi
    
    echo -e "   -> Baue Ops Control Center Image..."
    if docker build --target opscontrol -t b2c-opscontrol-local:latest . > /dev/null; then
        echo -e "${GREEN}   ✅ OpsControl Docker Build erfolgreich.${NC}"
    else
        echo -e "${RED}❌ OpsControl Docker Build fehlgeschlagen!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Alle Docker Images erfolgreich gebaut.${NC}\n"

    echo -e "${YELLOW}⛵ Prüfe Kubernetes Helm Charts (Linting & Templating)...${NC}"
    if command -v helm >/dev/null 2>&1; then
        echo -e "   -> Führe Helm Lint aus..."
        if helm lint ./helm/b2c-platform > /dev/null; then
            echo -e "${GREEN}   ✅ Helm Lint erfolgreich.${NC}"
        else
            echo -e "${RED}❌ Helm Lint fehlgeschlagen!${NC}"
            exit 1
        fi
        
        echo -e "   -> Teste Helm Template Generierung..."
        if helm template test-release ./helm/b2c-platform > /dev/null; then
            echo -e "${GREEN}   ✅ Helm Templating erfolgreich.${NC}"
        else
            echo -e "${RED}❌ Helm Templating fehlgeschlagen!${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Helm CLI nicht installiert. Überspringe Helm Checks.${NC}"
    fi
    
    echo -e "\n${GREEN}========================================================================${NC}"
    echo -e "${GREEN}🎉 CI/CD Simulationslauf war erfolgreich! Du kannst nun sicher pushen.${NC}"
    echo -e "${GREEN}========================================================================${NC}"
    exit 0
fi

echo -e "${BLUE}🚀 Starte B2C Contract Checker Local Dev Environment...${NC}\n"

# --- Cleanup Trap ---
# Diese Funktion sorgt dafür, dass bei STRG+C alles sauber heruntergefahren wird
cleanup() {
    echo -e "\n${YELLOW}🛑 Beende Services und räume auf...${NC}"

    # Beende die Hintergrundprozesse (Java & Python)
    kill $(jobs -p) 2>/dev/null || true

    # Fahre Docker sauber herunter (gehe sicher in den richtigen Ordner)
    echo -e "${YELLOW}🛑 Stoppe Docker Container...${NC}"
    cd "$ROOT_DIR" && docker compose down > /dev/null 2>&1

    echo -e "${GREEN}✅ Alles sauber beendet. Auf Wiedersehen!${NC}"
    exit 0
}

# Fange das Beenden-Signal (STRG+C) ab und führe cleanup() aus
trap cleanup SIGINT SIGTERM

# --- 1. Port Cleanup (Prevent "Address already in use" errors) ---
echo -e "${BLUE}🧹 Räume blockierte Ports auf (8080, 8000, 8090)...${NC}"
kill -9 $(lsof -t -i :8080) 2>/dev/null || true
kill -9 $(lsof -t -i :8000) 2>/dev/null || true
kill -9 $(lsof -t -i :8090) 2>/dev/null || true
echo -e "${GREEN}✅ Ports sind frei.${NC}\n"

# --- 1.1 Check .env ---
if grep -q "YOUR_GEMINI_API_KEY" "03_b2c-ai-gateway/.env" 2>/dev/null; then
    echo -e "${RED}⚠️  WARNUNG: GEMINI_API_KEY ist noch auf 'YOUR_GEMINI_API_KEY' gesetzt in 03_b2c-ai-gateway/.env!${NC}"
    echo -e "${RED}   Die KI-Analysen und der Chatbot werden mit einem Fehler fehlschlagen.${NC}\n"
else
    echo -e "${GREEN}✅ Gemini API Key gefunden.${NC}\n"
fi

# --- 2. Starte Docker (Postgres, MinIO & Python AI Gateway) ---
echo -e "${BLUE}🐳 Starte Docker Infrastruktur (Postgres, MinIO & Python AI Gateway)...${NC}"
cd "$ROOT_DIR"
# Load environment variables from env file for Gemini API Key mapping and layer both compose files for dev from the root
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file 03_b2c-ai-gateway/.env up -d --build
echo -e "${GREEN}✅ Docker Container gestartet.${NC}\n"

# --- 3. Starte Java Spring Boot Backend ---
echo -e "${BLUE}☕ Starte Java Spring Boot Backend (Profil: dev)...${NC}"
cd "$ROOT_DIR/02_b2c-contractchecker-spring"
# Starte Maven/Spring im Hintergrund
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
cd "$ROOT_DIR"

# Kurze Pause, damit Java hochfahren kann
sleep 5

# --- 4. Starte Ops Control Center PWA ---
echo -e "${BLUE}🛡️ Starte Ops Control Center PWA...${NC}"
cd "$ROOT_DIR/04_ops-control-center"
python3 -m http.server 8090 --bind 0.0.0.0 > /dev/null 2>&1 &
cd "$ROOT_DIR"

# --- 5. Ready! ---
echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}🎉 Alle Services starten im Hintergrund!${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "🌍 ${BLUE}Spring Boot UI:${NC}    http://localhost:8080"
echo -e "🌍 ${BLUE}FastAPI API-Docs:${NC}  http://localhost:8000/docs"
echo -e "🌍 ${BLUE}Ops Control PWA:${NC}  http://localhost:8090"
echo -e "🌍 ${BLUE}MinIO S3 Console:${NC}  http://localhost:9001 ${YELLOW}(minioadmin / minioadmin123)${NC}"
echo -e "\n${YELLOW}Drücke STRG+C (Ctrl+C), um alle Server und Docker Container sauber zu beenden.${NC}\n"

# Warte auf die Hintergrundprozesse, damit das Skript nicht sofort beendet wird
wait
