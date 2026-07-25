#!/bin/bash

# ==============================================================================
# IHZ B2C Platform - GitHub Secrets Sync
# Liest die Secrets aus `.secrets/github_secrets.env` und lädt sie sicher
# ins verknüpfte GitHub Repository hoch.
# ==============================================================================

set -euo pipefail

# Text formatting helper
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }
success() { echo -e "\033[1;32m[SUCCESS]\033[0m $*"; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="$ROOT_DIR/.secrets/github_secrets.env"

echo "======================================================================"
echo "    IHZ B2C Platform - GitHub Secrets Uploader"
echo "======================================================================"

# 1. Prüfen, ob die GitHub CLI installiert ist
if ! command -v gh &> /dev/null; then
    error "Die GitHub CLI ('gh') ist nicht installiert."
    echo "Bitte installiere sie (z. B. mit 'brew install gh') und logge dich per 'gh auth login' ein."
    exit 1
fi

# 2. Prüfen, ob wir eingeloggt sind
if ! gh auth status &> /dev/null; then
    error "Du bist nicht in der GitHub CLI eingeloggt. Bitte führe 'gh auth login' aus."
    exit 1
fi

# 3. Prüfen, ob die Secrets-Datei existiert
if [ ! -f "$SECRETS_FILE" ]; then
    error "Die Secrets-Datei '$SECRETS_FILE' wurde nicht gefunden!"
    exit 1
fi

info "Lese Secrets aus '$SECRETS_FILE'..."

# 4. Secrets auslesen und zu GitHub pushen
while IFS= read -r line || [ -n "$line" ]; do
    # Leere Zeilen und Kommentare (#) überspringen
    if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
        continue
    fi

    # Key und Value trennen (unterstützt auch '=' innerhalb des Values)
    KEY="${line%%=*}"
    VALUE="${line#*=}"

    # Trimmen von Whitespaces (falls vorhanden)
    KEY=$(echo "$KEY" | xargs)
    VALUE=$(echo "$VALUE" | xargs)

    if [ -n "$KEY" ] && [ -n "$VALUE" ]; then
        info "Pushe Repository-Secret: $KEY"
        echo -n "$VALUE" | gh secret set "$KEY"
    fi
done < "$SECRETS_FILE"

echo "======================================================================"
success "Alle Secrets aus .secrets/github_secrets.env wurden erfolgreich hochgeladen!"
echo "Du kannst sie hier überprüfen: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
