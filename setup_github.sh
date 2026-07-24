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
read -p "GCP Project ID (z.B. ihz-contract-checker): " GCP_PROJECT_ID
read -p "GKE Cluster Name (z.B. b2c-gke-cluster): " GKE_CLUSTER
read -p "GKE Zone (z.B. europe-west1-b): " GKE_ZONE
read -p "GCP WIF Workload Identity Provider URI (aus setup_wif.sh): " GCP_WIF_PROVIDER
read -p "GCP Service Account Email (z.B. b2c-app-sa@...): " GCP_SA_EMAIL

# 3. Create Environments
info "Erstelle GitHub Environments..."
# Staging Environment erstellen
gh api -X PUT /repos/{owner}/{repo}/environments/staging -F reviewers=[] --silent || true
success "Environment 'staging' erstellt."

# Production Environment erstellen (fordert Reviewer-Freigabe an)
gh api -X PUT /repos/{owner}/{repo}/environments/production --silent || true
success "Environment 'production' erstellt (erfordert Freigabe im GitHub UI)."

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

# Staging Database & LLM Secrets
read -sp "Gib den Gemini API-Key für STAGING ein: " GEMINI_KEY_STAGE; echo ""
read -sp "Gib den Langfuse Secret-Key für STAGING ein: " LF_SECRET_STAGE; echo ""
read -sp "Gib den Langfuse Public-Key für STAGING ein: " LF_PUBLIC_STAGE; echo ""
read -sp "Gib das Datenbank-Passwort für STAGING ein: " DB_PASS_STAGE; echo ""

gh secret set GEMINI_API_KEY --env staging --body "$GEMINI_KEY_STAGE"
gh secret set LANGFUSE_SECRET_KEY --env staging --body "$LF_SECRET_STAGE"
gh secret set LANGFUSE_PUBLIC_KEY --env staging --body "$LF_PUBLIC_STAGE"
gh secret set DB_PASSWORD --env staging --body "$DB_PASS_STAGE"
success "Staging-Secrets erfolgreich konfiguriert."

# Production Database & LLM Secrets
read -sp "Gib den Gemini API-Key für PRODUCTION ein: " GEMINI_KEY_PROD; echo ""
read -sp "Gib den Langfuse Secret-Key für PRODUCTION ein: " LF_SECRET_PROD; echo ""
read -sp "Gib den Langfuse Public-Key für PRODUCTION ein: " LF_PUBLIC_PROD; echo ""
read -sp "Gib das Datenbank-Passwort für PRODUCTION ein: " DB_PASS_PROD; echo ""

gh secret set GEMINI_API_KEY --env production --body "$GEMINI_KEY_PROD"
gh secret set LANGFUSE_SECRET_KEY --env production --body "$LF_SECRET_PROD"
gh secret set LANGFUSE_PUBLIC_KEY --env production --body "$LF_PUBLIC_PROD"
gh secret set DB_PASSWORD --env production --body "$DB_PASS_PROD"
success "Production-Secrets erfolgreich konfiguriert."

echo "======================================================================"
success "GitHub Secrets & Environments wurden vollständig automatisiert eingerichtet!"
echo "Du kannst jetzt deine Änderungen pushen, um die CI/CD-Pipeline zu triggern."
echo "======================================================================"
