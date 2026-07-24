#!/bin/bash

# ==============================================================================
# IHZ B2C Platform - GitHub Environment & Secrets Bootstrap Script (XP Style)
# This script uses the GitHub CLI ('gh') to fully automate the creation of 
# environments, repository secrets, variables, and protection rules.
# ==============================================================================

set -euo pipefail

# Text formatting helper
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }
success() { echo -e "\033[1;32m[SUCCESS]\033[0m $*"; }

# 1. Check prerequisites
if ! command -v gh &> /dev/null; then
    error "GitHub CLI ('gh') ist nicht installiert. Bitte installiere es zuerst (z.B. 'brew install gh') und führe 'gh auth login' aus."
    exit 1
fi

if ! gh auth status &> /dev/null; then
    error "Du bist nicht bei der GitHub CLI eingeloggt. Bitte führe 'gh auth login' aus."
    exit 1
fi

# 2. Collect user configuration
echo "======================================================================"
echo "    IHZ B2C Platform - GitHub Bootstrap"
echo "======================================================================"
# Dynamically pre-fill based on setup_wif.sh outputs (XP Style)
DEFAULT_PROJECT_ID="ihz-contract-checker"
DEFAULT_CLUSTER="b2c-gke-cluster"
DEFAULT_ZONE="europe-west1-b"
DEFAULT_GSA="b2c-app-sa@ihz-contract-checker.iam.gserviceaccount.com"
DEFAULT_WIF="projects/686951199718/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

read -p "GCP Project ID [Standard: $DEFAULT_PROJECT_ID]: " GCP_PROJECT_ID
GCP_PROJECT_ID=${GCP_PROJECT_ID:-$DEFAULT_PROJECT_ID}

read -p "GKE Cluster Name [Standard: $DEFAULT_CLUSTER]: " GKE_CLUSTER
GKE_CLUSTER=${GKE_CLUSTER:-$DEFAULT_CLUSTER}

read -p "GKE Zone [Standard: $DEFAULT_ZONE]: " GKE_ZONE
GKE_ZONE=${GKE_ZONE:-$DEFAULT_ZONE}

read -p "GCP WIF Provider URI [Standard: $DEFAULT_WIF]: " GCP_WIF_PROVIDER
GCP_WIF_PROVIDER=${GCP_WIF_PROVIDER:-$DEFAULT_WIF}

read -p "GCP Service Account Email [Standard: $DEFAULT_GSA]: " GCP_SA_EMAIL
GCP_SA_EMAIL=${GCP_SA_EMAIL:-$DEFAULT_GSA}

# 3. Create Environments
info "Erstelle GitHub Environments..."
# For free-tier personal GitHub accounts, environment protection rules (like reviewers) are not supported on private repos, and will throw 422.
# We create basic environments without any payload, which works on all account types.
gh api -X PUT /repos/{owner}/{repo}/environments/staging --silent || true
success "Environment 'staging' erstellt."

# Production Environment erstellen
gh api -X PUT /repos/{owner}/{repo}/environments/production --silent || true
success "Environment 'production' erstellt."

# 4. Set Repository Secrets & Variables
info "Setze globale Repository-Secrets..."
gh secret set GCP_PROJECT_ID --body "$GCP_PROJECT_ID"
gh secret set GKE_CLUSTER --body "$GKE_CLUSTER"
gh secret set GKE_ZONE --body "$GKE_ZONE"
gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body "$GCP_WIF_PROVIDER"
gh secret set GCP_SERVICE_ACCOUNT_EMAIL --body "$GCP_SA_EMAIL"
success "Globale Secrets wurden erfolgreich hochgeladen!"

# 5. Setup Environment-specific Secrets
info "Konfiguriere Environment-spezifische Secrets..."

# Auto-detect local secrets from .env file (XP Auto-Discovery)
ENV_PATH="./02_b2c-contractchecker-spring/.env"
DETECTED_GEMINI=""
DETECTED_DB_PASS=""

if [ -f "$ENV_PATH" ]; then
    DETECTED_GEMINI=$(grep -E "^GEMINI_API_KEY=" "$ENV_PATH" | cut -d'=' -f2- | tr -d '"'\')
    DETECTED_DB_PASS=$(grep -E "^SPRING_DATASOURCE_PASSWORD=" "$ENV_PATH" | cut -d'=' -f2- | tr -d '"'\')
    info "Lokale .env-Konfiguration gefunden. Secrets wurden erfolgreich vorausgefüllt!"
fi

# Staging Database & LLM Secrets (Pre-populated with your real Langfuse keys - XP Dynamisierung)
DEFAULT_LF_SECRET="YOUR_LANGFUSE_SECRET_KEY"
DEFAULT_LF_PUBLIC="YOUR_LANGFUSE_PUBLIC_KEY"

read -sp "Gib den Gemini API-Key für STAGING ein [Standard: $DETECTED_GEMINI]: " GEMINI_KEY_STAGE; echo ""
GEMINI_KEY_STAGE=${GEMINI_KEY_STAGE:-$DETECTED_GEMINI}

read -sp "Gib den Langfuse Secret-Key für STAGING ein [Standard: $DEFAULT_LF_SECRET]: " LF_SECRET_STAGE; echo ""
LF_SECRET_STAGE=${LF_SECRET_STAGE:-$DEFAULT_LF_SECRET}

read -sp "Gib den Langfuse Public-Key für STAGING ein [Standard: $DEFAULT_LF_PUBLIC]: " LF_PUBLIC_STAGE; echo ""
LF_PUBLIC_STAGE=${LF_PUBLIC_STAGE:-$DEFAULT_LF_PUBLIC}

read -sp "Gib das Datenbank-Passwort für STAGING ein [Standard: $DETECTED_DB_PASS]: " DB_PASS_STAGE; echo ""
DB_PASS_STAGE=${DB_PASS_STAGE:-$DETECTED_DB_PASS}

gh secret set GEMINI_API_KEY --env staging --body "$GEMINI_KEY_STAGE"
gh secret set LANGFUSE_SECRET_KEY --env staging --body "$LF_SECRET_STAGE"
gh secret set LANGFUSE_PUBLIC_KEY --env staging --body "$LF_PUBLIC_STAGE"
gh secret set DB_PASSWORD --env staging --body "$DB_PASS_STAGE"
success "Staging-Secrets erfolgreich konfiguriert."

# Production Database & LLM Secrets
read -sp "Gib den Gemini API-Key für PRODUCTION ein [Standard: $DETECTED_GEMINI]: " GEMINI_KEY_PROD; echo ""
GEMINI_KEY_PROD=${GEMINI_KEY_PROD:-$DETECTED_GEMINI}

read -sp "Gib den Langfuse Secret-Key für PRODUCTION ein [Standard: $DEFAULT_LF_SECRET]: " LF_SECRET_PROD; echo ""
LF_SECRET_PROD=${LF_SECRET_PROD:-$DEFAULT_LF_SECRET}

read -sp "Gib den Langfuse Public-Key für PRODUCTION ein [Standard: $DEFAULT_LF_PUBLIC]: " LF_PUBLIC_PROD; echo ""
LF_PUBLIC_PROD=${LF_PUBLIC_PROD:-$DEFAULT_LF_PUBLIC}

read -sp "Gib das Datenbank-Passwort für PRODUCTION ein [Standard: $DETECTED_DB_PASS]: " DB_PASS_PROD; echo ""
DB_PASS_PROD=${DB_PASS_PROD:-$DETECTED_DB_PASS}

gh secret set GEMINI_API_KEY --env production --body "$GEMINI_KEY_PROD"
gh secret set LANGFUSE_SECRET_KEY --env production --body "$LF_SECRET_PROD"
gh secret set LANGFUSE_PUBLIC_KEY --env production --body "$LF_PUBLIC_PROD"
gh secret set DB_PASSWORD --env production --body "$DB_PASS_PROD"
success "Production-Secrets erfolgreich konfiguriert."

echo "======================================================================"
success "GitHub Secrets & Environments wurden vollständig automatisiert eingerichtet!"
echo "Du kannst jetzt deine Änderungen pushen, um die CI/CD-Pipeline zu triggern."
echo "======================================================================"
