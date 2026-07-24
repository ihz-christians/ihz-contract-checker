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

echo -e "${BLUE}🚀 Starte B2C Contract Checker Local Dev Environment...${NC}\n"

# --- Cleanup Trap ---
# Diese Funktion sorgt dafür, dass bei STRG+C alles sauber heruntergefahren wird
cleanup() {
    echo -e "\n${YELLOW}🛑 Beende Services und räume auf...${NC}"

    # Beende die Hintergrundprozesse (Java & Python)
    kill $(jobs -p) 2>/dev/null || true

    # Fahre Docker sauber herunter (gehe sicher in den richtigen Ordner)
    echo -e "${YELLOW}🛑 Stoppe Docker Container...${NC}"
    cd "$ROOT_DIR/02_b2c-contractchecker-spring" && docker compose down > /dev/null 2>&1

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

# --- 2. Starte Docker (MinIO & Postgres) ---
echo -e "${BLUE}🐳 Starte Docker Infrastruktur (Postgres, MinIO)...${NC}"
cd "$ROOT_DIR/02_b2c-contractchecker-spring"
docker compose up -d
cd "$ROOT_DIR"
echo -e "${GREEN}✅ Docker läuft.${NC}\n"

# --- 3. Starte Python AI-Gateway mit UV ---
echo -e "${BLUE}🐍 Starte Python AI Gateway via uv...${NC}"
cd "$ROOT_DIR/03_b2c-ai-gateway"
# Stelle sicher, dass die Pakete installiert sind (geht dank uv in Millisekunden)
# Da uv sehr strikt ist, weisen wir es explizit auf unser lokales venv hin:
VIRTUAL_ENV=venv uv pip install -r requirements.txt > /dev/null 2>&1 || true

# Starte Uvicorn im Hintergrund mit explizitem Pfad zum Binary
# Achtung: uv pip erzeugt manchmal keine relativen bin-Links, wenn man es force-überschreibt.
# Wir nutzen daher den Python-Interpreter aus dem venv, um uvicorn als Modul zu starten:
./venv/bin/python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
cd "$ROOT_DIR"

# Kurze Pause, damit Python nicht im gleichen Millisekunden-Log-Stream mit Java kollidiert
sleep 2

# --- 4. Starte Java Spring Boot Backend ---
echo -e "${BLUE}☕ Starte Java Spring Boot Backend (Profil: dev)...${NC}"
cd "$ROOT_DIR/02_b2c-contractchecker-spring"
# Starte Maven/Spring im Hintergrund
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
cd "$ROOT_DIR"

# --- 4.5 Starte Ops Control Center PWA ---
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
