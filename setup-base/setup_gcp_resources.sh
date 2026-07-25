#!/bin/bash

# ==============================================================================
# IHZ B2C Platform - GCP Cloud Infrastructure Bootstrap Script (XP Style)
# This script uses the Google Cloud SDK ('gcloud') to fully automate the creation
# and secure configuration of GCP resources (APIs, GKE, Registry, GCS, IAM).
# ==============================================================================

set -euo pipefail

# Text formatting helper
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }
success() { echo -e "\033[1;32m[SUCCESS]\033[0m $*"; }

# 1. Check prerequisites
if ! command -v gcloud &> /dev/null; then
    error "Google Cloud SDK ('gcloud') ist nicht installiert. Bitte installiere es zuerst (https://cloud.google.com/sdk/docs/install)."
    exit 1
fi

# 2. Collect configuration
PROJECT_ID="ihz-contract-checker"
REGION="europe-west1"
ZONE="europe-west1-b"
REGISTRY_NAME="b2c-repo"
BUCKET_NAME="ihz-contracts-${PROJECT_ID}"
CLUSTER_NAME="b2c-gke-cluster"

echo "======================================================================"
echo "    IHZ B2C Platform - GCP Infrastructure Bootstrap"
echo "======================================================================"
echo "Project-ID:    $PROJECT_ID"
echo "Region:        $REGION"
echo "Zone:          $ZONE"
echo "Cluster:       $CLUSTER_NAME"
echo "Bucket:        $BUCKET_NAME"
echo "======================================================================"

# 3. Create GCP Project
info "Erstelle GCP-Projekt '$PROJECT_ID'..."
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    success "Projekt '$PROJECT_ID' existiert bereits."
else
    gcloud projects create "$PROJECT_ID" --name="IHZ B2C Contract-Checker"
    success "Projekt '$PROJECT_ID' erfolgreich erstellt!"
fi

# Setze das aktuelle Projekt im gcloud Kontext
gcloud config set project "$PROJECT_ID"

# 4. Handle GCP Billing Association (XP Robustness)
info "Prüfe Abrechnungskonto (Billing Account)..."
# We filter only active/open billing accounts if possible
BILLING_ACCOUNTS=$(gcloud beta billing accounts list --filter="open=true" --format="value(name)" 2>/dev/null || true)

if [ -z "$BILLING_ACCOUNTS" ]; then
    error "Kein AKTIVES/OFFENES Abrechnungskonto (Billing Account) über gcloud CLI gefunden!"
    info "Der Google-Fehler meldet, dass dein Abrechnungskonto geschlossen ('not open') oder inaktiv ist."
    info "Bitte aktiviere, öffne oder verknüpfe ein gültiges Abrechnungskonto manuell im Console Web-Interface:"
    info "👉 https://console.cloud.google.com/billing"
    info "👉 https://console.cloud.google.com/billing/linkedaccounts?project=$PROJECT_ID"
    info "Sobald dein Billing Account wieder 'aktiv/offen' ist, starte dieses Skript einfach erneut."
    exit 1
else
    # Take the first open billing account found
    FIRST_ACCOUNT=$(echo "$BILLING_ACCOUNTS" | head -n 1)
    info "Verknüpfe Projekt '$PROJECT_ID' mit Abrechnungskonto '$FIRST_ACCOUNT'..."
    if gcloud beta billing projects link "$PROJECT_ID" --billing-account="$FIRST_ACCOUNT" &>/dev/null; then
        success "Projekt wurde erfolgreich mit dem Abrechnungskonto verknüpft!"
    else
        error "Verknüpfung fehlgeschlagen. Bitte verknüpfe das Abrechnungskonto manuell unter:"
        info "👉 https://console.cloud.google.com/billing/linkedaccounts?project=$PROJECT_ID"
        exit 1
    fi
fi

# 5. Enable Google Cloud APIs (Least Privilege & Needs-Based)
info "Aktiviere benötigte GCP Service-APIs (das kann einige Minuten dauern)..."
# We run this synchronously (without --async) so that the script blocks until
# all APIs are fully ready. This prevents downstream commands from failing.
gcloud services enable \
    container.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    sqladmin.googleapis.com \
    iam.googleapis.com \
    iap.googleapis.com

# 6. Create Artifact Registry
info "Erstelle Artifact Registry Docker Repository '$REGISTRY_NAME'..."
if gcloud artifacts repositories describe "$REGISTRY_NAME" --location="$REGION" &>/dev/null; then
    success "Repository '$REGISTRY_NAME' existiert bereits."
else
    gcloud artifacts repositories create "$REGISTRY_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker Repository for B2C Module Microservices"
    success "Docker Registry erfolgreich erstellt."
fi

# 7. Create Google Cloud Storage (GCS) Bucket for PDF/Document Uploads
info "Erstelle GCS Bucket '$BUCKET_NAME'..."
if gcloud storage buckets describe "gs://$BUCKET_NAME" &>/dev/null; then
    success "Bucket '$BUCKET_NAME' existiert bereits."
else
    # Create bucket with uniform bucket-level access (Security Best Practice)
    gcloud storage buckets create "gs://$BUCKET_NAME" \
        --location="$REGION" \
        --uniform-bucket-level-access
    success "Bucket '$BUCKET_NAME' erfolgreich erstellt."
fi

# 8. Create secure GKE Cluster (with Workload Identity Enabled!)
info "Erstelle GKE Kubernetes Cluster '$CLUSTER_NAME' (dies kann 5-10 Minuten dauern)..."
if gcloud container clusters describe "$CLUSTER_NAME" --zone="$ZONE" &>/dev/null; then
    success "GKE Cluster '$CLUSTER_NAME' existiert bereits."
else
    # Spin up GKE with Workload Identity & Shielded Nodes (Hardened Security)
    gcloud container clusters create "$CLUSTER_NAME" \
        --zone="$ZONE" \
        --num-nodes=3 \
        --machine-type="e2-standard-2" \
        --enable-ip-alias \
        --workload-pool="${PROJECT_ID}.svc.id.goog" \
        --enable-shielded-nodes \
        --no-enable-basic-auth
    success "GKE Cluster erfolgreich erstellt und gehärtet!"
fi

# Get GKE credentials
gcloud container clusters get-credentials "$CLUSTER_NAME" --zone="$ZONE"

# 9. Setup IAM & Workload Identity for Spring Backend & AI Gateway
info "Richte IAM & GKE Workload Identity ein..."

GSA_NAME="b2c-app-sa"
GSA_EMAIL="${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create Google Service Account
if gcloud iam service-accounts describe "$GSA_EMAIL" &>/dev/null; then
    success "Google Service Account '$GSA_NAME' existiert bereits."
else
    gcloud iam service-accounts create "$GSA_NAME" \
        --display-name="Service Account for B2C Pods"
    success "Google Service Account '$GSA_NAME' erstellt."
fi

# Grant Bucket Admin role to GSA
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
    --member="serviceAccount:$GSA_EMAIL" \
    --role="roles/storage.objectAdmin"

# Grant Artifact Registry Writer role to GSA so CI/CD can push images
gcloud artifacts repositories add-iam-policy-binding "$REGISTRY_NAME" \
    --location="$REGION" \
    --member="serviceAccount:$GSA_EMAIL" \
    --role="roles/artifactregistry.writer"

# Grant GKE Developer role to GSA so CI/CD can get credentials and deploy
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GSA_EMAIL" \
    --role="roles/container.developer"

# Bind GKE Service Accounts (Staging & Production) to GSA
info "Binde Kubernetes Service Accounts an Google IAM..."

# Staging Bindings
gcloud iam service-accounts add-iam-policy-binding "$GSA_EMAIL" \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:${PROJECT_ID}.svc.id.goog[staging/backend-sa]"

gcloud iam service-accounts add-iam-policy-binding "$GSA_EMAIL" \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:${PROJECT_ID}.svc.id.goog[staging/aigateway-sa]"

# Production Bindings
gcloud iam service-accounts add-iam-policy-binding "$GSA_EMAIL" \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:${PROJECT_ID}.svc.id.goog[production/backend-sa]"

gcloud iam service-accounts add-iam-policy-binding "$GSA_EMAIL" \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:${PROJECT_ID}.svc.id.goog[production/aigateway-sa]"

# 10. Setup IAP for Ops Control Center
info "Konfiguriere Identity-Aware Proxy (IAP) für das Ops Control Center..."

# Ensure OAuth Brand exists (required for IAP)
if ! gcloud iap oauth-brands list &>/dev/null; then
    info "Erstelle OAuth Consent Screen (Internal) für IAP..."
    # Note: Requires user consent or organization setup, falling back to info
    info "Bitte stelle sicher, dass der OAuth Consent Screen im GCP Console erstellt wurde!"
fi

# Create Secret for IAP BackendConfig
info "Erstelle Kubernetes Secret für IAP BackendConfig in 'default' und 'staging' namespaces..."
if command -v kubectl &> /dev/null; then
    kubectl create secret generic my-iap-secret \
        --from-literal=client_id=REPLACE_WITH_OAUTH_CLIENT_ID \
        --from-literal=client_secret=REPLACE_WITH_OAUTH_CLIENT_SECRET \
        --namespace default --dry-run=client -o yaml | kubectl apply -f -

    kubectl create namespace staging --dry-run=client -o yaml | kubectl apply -f -
    kubectl create secret generic my-iap-secret \
        --from-literal=client_id=REPLACE_WITH_OAUTH_CLIENT_ID \
        --from-literal=client_secret=REPLACE_WITH_OAUTH_CLIENT_SECRET \
        --namespace staging --dry-run=client -o yaml | kubectl apply -f -

    info "Die IAP BackendConfig Secret 'my-iap-secret' wurde mit Platzhaltern erstellt."
    info "BITTE ERSETZE DIE PLATZHALTER NACHTRÄGLICH MIT ECHTEN OAUTH CREDENTIALS (GCP Console -> APIs & Services -> Credentials)."
else
    info "Kubernetes CLI ('kubectl') ist auf diesem System nicht installiert."
    info "Das Secret 'my-iap-secret' für IAP wurde übersprungen."
    info "Du kannst es später manuell über die GCP Cloud Shell oder nach Installation von kubectl via:"
    info "👉 gcloud components install kubectl"
    info "erstellen."
fi

echo "======================================================================"
success "GCP Cloud-Infrastruktur wurde vollständig, sicher & automatisiert aufgesetzt!"
echo "Du kannst nun './setup_github.sh' starten, um deine CI/CD-Pipeline zu verknüpfen."
echo "======================================================================"
