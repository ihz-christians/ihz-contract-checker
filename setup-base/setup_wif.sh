#!/bin/bash

# ==============================================================================
# IHZ B2C Platform - Setup Workload Identity Federation (WIF) for GitHub Actions
# This script configures GCP to allow GitHub Actions to authenticate securely
# without needing a static JSON service account key.
# ==============================================================================

set -euo pipefail

# Text formatting helper
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }
success() { echo -e "\033[1;32m[SUCCESS]\033[0m $*"; }

PROJECT_ID="ihz-contract-checker"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"
GSA_NAME="b2c-app-sa"
# Replace this with your actual GitHub repository name, e.g., "your-org/your-repo"
GITHUB_REPO=""

echo "======================================================================"
echo "    IHZ B2C Platform - Workload Identity Federation (WIF) Setup"
echo "======================================================================"

# Auto-detect GitHub Repository from local Git configuration (XP Dynamisierung)
DETECTED_REPO=$(git config --get remote.origin.url 2>/dev/null || true)
if [ -n "$DETECTED_REPO" ]; then
    # Strip potential prefix (https://github.com/ or git@github.com:) and suffix (.git)
    GITHUB_REPO=$(echo "$DETECTED_REPO" | sed -E 's/.*github\.com[\/:]//' | sed 's/\.git$//')
    info "Automatisch erkanntes GitHub-Repository: $GITHUB_REPO"
else
    GITHUB_REPO=""
fi

# If auto-detection failed, prompt the user
if [ -z "$GITHUB_REPO" ]; then
    read -p "Bitte gib dein GitHub-Repository im Format 'owner/repository' ein (z.B. ihrezuhauseberatung/b2c-module): " GITHUB_REPO
fi

if [ -z "$GITHUB_REPO" ]; then
    error "GitHub-Repository darf nicht leer sein."
    exit 1
fi

gcloud config set project "$PROJECT_ID"

# 1. Enable IAM Credentials API
info "Aktiviere die IAM Credentials API..."
gcloud services enable iamcredentials.googleapis.com

# 2. Create Workload Identity Pool
info "Erstelle Workload Identity Pool..."
if gcloud iam workload-identity-pools describe "$POOL_NAME" --location="global" &>/dev/null; then
    success "Workload Identity Pool '$POOL_NAME' existiert bereits."
else
    gcloud iam workload-identity-pools create "$POOL_NAME" \
        --location="global" \
        --display-name="GitHub Actions Pool"
    success "Workload Identity Pool '$POOL_NAME' erfolgreich erstellt."
fi

# 3. Create Workload Identity Provider for GitHub Actions
info "Erstelle Workload Identity Provider..."
if gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
    --workload-identity-pool="$POOL_NAME" \
    --location="global" &>/dev/null; then
    success "Workload Identity Provider '$PROVIDER_NAME' existiert bereits."
else
    # Corrected attribute-mapping and attribute-condition following GCP requirements
    gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
        --workload-identity-pool="$POOL_NAME" \
        --location="global" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository != ''" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --display-name="GitHub Provider"
    success "Workload Identity Provider '$PROVIDER_NAME' erfolgreich erstellt."
fi

# Get Pool and Provider Resource Names
POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" --location="global" --format="value(name)")

# 4. Bind the Google Service Account to the Workload Identity Pool
info "Erlaube GitHub Actions, sich als Service Account '$GSA_NAME' zu authentifizieren..."
gcloud iam service-accounts add-iam-policy-binding \
    "b2c-app-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_REPO}"

# Get the Workload Identity Provider resource path
WIF_PROVIDER_URI="projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

echo "======================================================================"
success "Workload Identity Federation wurde erfolgreich in GCP konfiguriert!"
echo ""
echo "Füge nun diese Werte in deiner GitHub Actions-Datei (.yml) oder als Secrets hinzu:"
echo "----------------------------------------------------------------------"
echo "👉 WORKLOAD_IDENTITY_PROVIDER (WIF Provider URI):"
echo "   $WIF_PROVIDER_URI"
echo ""
echo "👉 SERVICE_ACCOUNT_EMAIL:"
echo "   b2c-app-sa@${PROJECT_ID}.iam.gserviceaccount.com"
echo "======================================================================"
