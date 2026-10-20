# Deployment Guide: Kubernetes (GKE), CI/CD & Production Setup

Dieses Dokument beschreibt das Deployment und den Betrieb der B2C Contract Checker Plattform auf **Google Kubernetes Engine (GKE)** via Helm und GitHub Actions.

---

## 1. Übersicht der Deployment-Architektur

Die Plattform wird als Container-Microservices auf GKE in isolierten Namespaces (`staging`, `production`) betrieben:

* **Backend (`02_b2c-contractchecker-spring`)**:
  * Spring Boot 3 Anwendung (Port 8080)
  * Management & Health Probes (Port 8081: `/actuator/health/liveness`, `/actuator/health/readiness`)
  * Verwaltet Datenbank-Migrationen (Flyway)
* **AI-Gateway (`03_b2c-ai-gateway`)**:
  * FastAPI Asynchroner Worker (Port 8000)
  * Horizontal Pod Autoscaling (HPA) basierend auf CPU/Memory
* **Ops Control Center (`04_ops-control-center`)**:
  * Statische PWA ausgeliefert via Caddy/Nginx (Port 80)
* **Ingress & TLS**:
  * Nginx-Ingress / GCE Ingress mit automatischen Let's Encrypt TLS-Zertifikaten (cert-manager)

---

## 2. CI/CD Pipeline (GitHub Actions)

Die CI/CD-Pipeline in `.github/workflows/ci-cd.yml` führt folgende Schritte vollautomatisch aus:

1. **Test-Phase**:
   * **Backend**: Führt Unit- und Integrationstests auf Java 21 (Temurin) aus.
   * **AI-Gateway**: Führt Pytest-Suiten via Astral `uv` aus.
2. **Build & Push Phase** (nur auf `main` Branch):
   * Authentifizierung bei Google Cloud via **Workload Identity Federation (WIF)** – keine statischen Service-Account-Keys nötig.
   * Multi-Stage Docker Builds via `docker/build-push-action` mit GitHub Actions Cache.
   * Push der Images in die Google Artifact Registry (`europe-west1-docker.pkg.dev/$PROJECT_ID/b2c-repo/*`).
3. **Continuous Deployment**:
   * Automatisches Deployment nach **Staging** via Helm.
   * Manuelle Freigabe (Environment Approval) für **Production**.

---

## 3. Initiales Infrastruktur-Setup (Bootstrap)

Im Ordner `setup-base/` befinden sich Skripte zur Ersteinrichtung der Google Cloud-Ressourcen:

* **`setup-base/setup_gcp_resources.sh`**:
  * Erstellt GCP-Projekt, Artifact Registry (`b2c-repo`), GCS-Buckets und den GKE-Cluster.
* **`setup-base/setup_wif.sh`**:
  * Richtet Workload Identity Federation (WIF) für GitHub Actions ein.
* **`setup-base/setup_github.sh`**:
  * Setzt GitHub Repository Secrets und Environment-Schutzregeln.

---

## 4. Lokale Bereitstellung & Test

Für die lokale Entwicklung und das Testen vor dem Commit:

```bash
# Ersteinrichtung & Abhängigkeiten
./devlocal setup

# Lokale Infrastruktur & Services starten
./devlocal start

# Isolierte Tests ausführen
./devlocal test
```

---

## 5. Observability & Monitoring

* **Health Checks**: Liveness- und Readiness-Probes sind auf allen Services konfiguriert.
* **Logs**: Alle Services loggen strukturiert im JSON-Format auf `stdout`/`stderr` für Google Cloud Logging / FluentBit.
* **Metriken**: Prometheus-kompatible Actuator-Endpunkte auf dem separaten Management-Port `8081`.