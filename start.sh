#!/bin/bash
# ==============================================================================
# B2C Contract Checker - Environment Bootstrap Script
# ==============================================================================

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Bootstrapping B2C Environment...${NC}\n"

# 1. Prüfe, ob Nix installiert und im PATH ist
if ! command -v nix &> /dev/null; then
    # Oft ist Nix auf dem Mac installiert, aber in diesem Terminal-Tab noch nicht geladen
    if [ -f "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh" ]; then
        echo -e "${YELLOW}Lade Nix-Umgebungsvariablen in den aktuellen Kontext...${NC}"
        source "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh"
    else
        echo -e "${RED}❌ Nix Paketmanager nicht gefunden!${NC}"
        echo -e "Damit dieses Projekt garantiert ohne Versions-Konflikte läuft, nutzen wir Nix."
        echo -e "Bitte installiere Nix (dauert 1 Minute) mit folgendem Befehl:\n"
        echo -e "  ${CYAN}curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install${NC}\n"
        exit 1
    fi
fi

# 2. Prüfe, ob Docker läuft (Wichtig für Datenbank und Tests)
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}⚠️  ACHTUNG: Docker läuft nicht!${NC}"
    echo -e "Die Tools 'b2c dev' und 'b2c test' benötigen Docker für die PostgreSQL-Datenbank."
    echo -e "Bitte starte Docker Desktop (oder OrbStack/Colima) im Hintergrund.\n"
fi

# 3. Wechsle sicher in das Root-Verzeichnis des Projekts
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 4. Betrete die Nix-Shell
echo -e "${GREEN}✅ Alles bereit. Betrete isolierte Umgebung...${NC}"
nix develop
