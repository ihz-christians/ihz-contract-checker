# Deployment & Setup Guide (XP/DevOps)

This guide describes how to configure the Google Cloud (GCP) and GitHub Environments for a CI/CD pipeline following Extreme Programming (XP) practices. The pipeline handles testing, staging, and production deployments for `ihrezuhauseberatung.de`.

## 0. Automated GCP Resource Provisioning (Infrastructure as Code)
Before configuring GitHub, you can fully automate the creation of your GCP project, APIs, GKE clusters, buckets, and Workload Identity bindings using our interactive bootstrap script.

Run the script on a machine authenticated with `gcloud` (requires administrative permissions):
```bash
./setup_gcp_resources.sh
```

This script will automatically:
1. Create the GCP project `ihz-contract-checker` (or use it if already exists).
2. Enable all required GCP APIs (GKE, Artifact Registry, Cloud SQL, IAM, Cloud Storage).
3. Create the secure Artifact Registry `b2c-repo`.
4. Create the secure GCS bucket `ihz-contracts-ihz-contract-checker` with Uniform Bucket-Level Access (Security Best Practice).
5. Spin up a hardened GKE cluster `b2c-gke-cluster` with **Workload Identity**, Shielded Nodes, and metadata node concealment enabled.
6. Provision Google Service Accounts (GSA) and map them to Kubernetes Service Accounts (KSA) for staging/production namespaces using secure IAM bindings.

---

## 1. Architecture Overview
- **GKE (Google Kubernetes Engine)**: Hosts the Frontend (React/Nginx), Backend (Spring Boot), and AI Gateway (FastAPI).
- **Artifact Registry**: Stores Docker images for the 4 services (Frontend, Backend, AI Gateway, Ops Control Center).
- **GCS (Google Cloud Storage)**: Used by the Spring backend / AI gateway for file/document storage.
- **Cloud SQL (PostgreSQL)**: Database for the Spring backend.

## 2. GitHub Environments
Go to your repository settings -> **Environments** and create two environments:
1. `staging`: No special protection rules.
2. `production`: Add a **Required Reviewer** (manual approval) to ensure changes are verified in staging before going live.

## 3. GitHub Secrets Configuration (Workload Identity Federation - Passwordless Security)
To ensure maximum security and adhere to modern enterprise guidelines, the pipeline does **not** use static GCP JSON keys (which are blocked by GCP Org Policies like `disableServiceAccountKeyCreation`).

Instead, the pipeline uses **Workload Identity Federation (WIF)**, allowing GitHub Actions to securely authenticate using short-lived OpenID Connect (OIDC) tokens.

### A. Automatic Setup of WIF in GCP:
We have provided an automated script to fully configure WIF in your Google Cloud project. Simply run:
```bash
./setup_wif.sh
```
This script will:
1. Enable the `iamcredentials.googleapis.com` API.
2. Create an OIDC Workload Identity Pool (`github-pool`) and Provider (`github-provider`) for GitHub.
3. Bind your GitHub repository strictly to your Google Service Account (`b2c-app-sa`).
4. Output the exact values you need to configure on GitHub.

### B. Setup GitHub Secrets
You can then run `./setup_github.sh` or configure the following secrets at the **Repository** level on GitHub:

| Secret Name | Description |
|---|---|
| `GCP_PROJECT_ID` | Your Google Cloud project ID (e.g., `ihz-contract-checker`). |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | The WIF Provider URI (e.g., `projects/YOUR_PROJECT_NUM/locations/global/workloadIdentityPools/github-pool/providers/github-provider`). |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `b2c-app-sa@ihz-contract-checker.iam.gserviceaccount.com` |
| `GKE_CLUSTER` | The name of your GKE cluster (`b2c-gke-cluster`). |
| `GKE_ZONE` | The compute zone of your GKE cluster (`europe-west1-b`). |

## 4. Kubernetes Secrets (in GKE)
Create the necessary secrets inside your GKE cluster for both namespaces (`staging` and `production`):

```bash
# Staging Secrets
kubectl create namespace staging
kubectl create secret generic db-secrets -n staging \
  --from-literal=url='jdbc:postgresql://<CLOUDSQL_IP>:5432/staging_db' \
  --from-literal=username='postgres' \
  --from-literal=password='your-db-password'

kubectl create secret generic ai-secrets -n staging \
  --from-literal=gemini-api-key='your-gemini-key' \
  --from-literal=langfuse-secret-key='sk-lf-...' \
  --from-literal=langfuse-public-key='pk-lf-...'

# Production Secrets
kubectl create namespace production
kubectl create secret generic db-secrets -n production \
  --from-literal=url='jdbc:postgresql://<CLOUDSQL_IP>:5432/prod_db' \
  --from-literal=username='postgres' \
  --from-literal=password='your-db-password'

kubectl create secret generic ai-secrets -n production \
  --from-literal=gemini-api-key='your-gemini-key' \
  --from-literal=langfuse-secret-key='sk-lf-...' \
  --from-literal=langfuse-public-key='pk-lf-...'
```

## 5. Google Cloud Storage (GCS) and Workload Identity
To allow your pods (Spring Backend and AI Gateway) to securely access GCS buckets (e.g., for document uploads) without hardcoding JSON keys, use **GKE Workload Identity**:

1. Create a Google Service Account (GSA):
   ```bash
   gcloud iam service-accounts create b2c-app-sa
   ```
2. Grant GCS bucket access to the GSA:
   ```bash
   gcloud storage buckets add-iam-policy-binding gs://your-gbucket-name \
       --member "serviceAccount:b2c-app-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
       --role "roles/storage.objectAdmin"
   ```
3. Bind the Kubernetes Service Account (KSA) to the GSA:
   ```bash
   gcloud iam service-accounts add-iam-policy-binding b2c-app-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
       --role roles/iam.workloadIdentityUser \
       --member "serviceAccount:${GCP_PROJECT_ID}.svc.id.goog[staging/backend-sa]"
   ```
   *(Repeat for the production namespace and the aigateway-sa)*

The Helm chart is already configured to annotate the Kubernetes Service Accounts with the GSA:
```yaml
annotations:
  iam.gke.io/gcp-service-account: "backend-sa@your-gcp-project-id.iam.gserviceaccount.com"
```

## 6. Continuous Integration (CI) / Continuous Deployment (CD)
- **CI**: On every PR and push to `main`, tests are executed (Spring tests, Python Pytest, Node checks).
- **CD Staging**: When tests pass on `main`, images are built, pushed to Artifact Registry, and deployed via Helm to the `staging` namespace (accessible at `staging.ihrezuhauseberatung.de`).
- **CD Production**: After manual approval in the GitHub UI, the identical images are deployed to the `production` namespace (accessible at `ihrezuhauseberatung.de`).

## 7. Ops, Monitoring & LLMOps (Observability)

To ensure high availability and keep track of AI costs/hallucinations, the platform uses a highly robust observability stack:

### A. Infrastructure & Application Health (GKE & Spring Boot)
- **Liveness & Readiness Probes**: Configured across all Helm charts (Frontend `/`, Backend `/actuator/health/liveness`, AIGateway `/health`). Kubernetes will automatically restart crashed or deadlocked containers.
- **Spring Boot Actuator & Prometheus**: The Spring Backend exposes `/actuator/prometheus`. You can point GCP Cloud Monitoring (or any Prometheus instance) to this endpoint to scrape JVM metrics, HikariCP database pool usage, and HTTP request latencies.
- **Log Aggregation**: Because the apps run on GKE, all `stdout`/`stderr` logs automatically flow into **GCP Cloud Logging** without extra configuration.

### C. High Availability (HPA, PDB & Anti-Affinity)
- **Horizontal Pod Autoscaler (HPA)**: All modules are configured to auto-scale based on CPU utilization (e.g. backend scales from 2 to 10 pods if CPU hits 70%).
- **Pod Disruption Budgets (PDB)**: Ensures that at least 1 replica of each service is always running during cluster upgrades or node drains, guaranteeing zero downtime.
- **Pod Anti-Affinity**: Kubernetes is strictly instructed (`weight: 100`) to schedule replicas of the same service (e.g., the 2 backend pods) on **different physical nodes**. If a GCP compute node crashes, your application stays online.

### B. LLMOps (Langfuse for AI Gateway)
The Python AI Gateway integrates **Langfuse** via decorators to monitor LLM interactions.
- **Token Usage & Costs**: Automatically tracks the exact amount of Gemini tokens (Input/Output) consumed per request and calculates costs.
- **Prompt Tracing**: Logs every system prompt, context injection, and user query exactly as it was sent to the LLM (crucial for debugging hallucinations).
- **Latency**: Measures how long Gemini takes to respond to individual generation steps.
*(Note: Langfuse keys are optional. If they aren't provided in the `ai-secrets`, Langfuse will gracefully fail without disrupting the Gemini calls).*

### D. Operations Control Center (OCC)
- **Air-Gapped Dashboard**: A highly secure, dependency-free Vanilla JS PWA used for manual intervention, pipeline tracking, and monitoring cost metrics.
- **Isolated Routing**: The OCC is deployed as a separate microservice (`opscontrol`) and is exposed on a distinct subdomain (`ops.ihrezuhauseberatung.de`).
- **Security Requirement**: In a real production scenario, the `ops.` subdomain must be protected by **Google Cloud Identity-Aware Proxy (IAP)** to ensure only internal administrators can access the dashboard.
