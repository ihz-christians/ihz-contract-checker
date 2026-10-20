# 📋 B2C Contract Checker Platform

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%20(RLS)-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-GKE-326CE5.svg)](https://cloud.google.com/kubernetes-engine)

Die **B2C Contract Checker Platform** ist eine moderne, cloud-native Enterprise-Anwendung zur automatisierten Analyse, dem Vergleich und der rechtlichen Weiterverarbeitung von Verbraucherverträgen (Energie, Telekommunikation, Versicherungen).

> 💡 **Showcase & Projektkontext (Digital Transformation):**  
> Dieses Repository ist eine eigenständige **Referenz- und Machbarkeitsstudie zur Digitalen Transformation manueller Vertragsprozesse**. Es demonstriert praxisnah, wie Medienbrüche und zeitaufwendige manuelle Prüfaufwände im Kundenservice und Vertrieb durch das Zusammenspiel von **KI-Layout-Parsing (Python/FastAPI)**, **transaktionaler Enterprise-Sicherheit (Java 21 / Spring Boot 3 / Postgres RLS)** und **moderner Cloud-Native-Bereitstellung (Docker/Kubernetes)** automatisiert und skaliert werden können.

---

## 📑 Inhaltsverzeichnis

1. [Business Case & Transformationspotenzial](#-business-case--transformationspotenzial)
2. [Funktionsumfang](#-funktionsumfang)
3. [Monorepo-Architektur](#-monorepo-architektur)
4. [Schnellstart mit `./devlocal`](#-schnellstart-mit-devlocal)
5. [Services & Port-Übersicht](#-services--port-übersicht)
6. [Sicherheits- & Mandantenarchitektur](#-sicherheits--mandantenarchitektur)
7. [Dokumentations-Index](#-dokumentations-index)
8. [CI/CD & Deployment](#-cicd--deployment)

---

## 💼 Business Case & Transformationspotenzial

In der Prozessdigitalisierung ist Technologie ein Enabler für konkreten geschäftlichen Mehrwert. Die Plattform adressiert typische Ineffizienzen in der Dokumentenprüfung:

| Dimension | Traditioneller Prozess (As-Is) | Digitalisierte Plattform (To-Be) | Geschäftlicher Mehrwert |
| :--- | :--- | :--- | :--- |
| **Durchlaufzeit** | 35 – 45 Min. manuelle Durchsicht | < 30 Sek. KI-Extraktion | **> 90 % Zeitersparnis** pro Vorgang |
| **Skalierbarkeit** | Linear an Personalbestand gekoppelt | Dunkelverarbeitung (STP) | Tausende Verträge parallel verarbeitbar |
| **Fristen- & Compliance-Risiko** | Menschliche Fehlerquote (~18 %) | Regelbasierte TCO- & Fristenvalidierung | Vermeidung ungewollter Vertragsverlängerungen |
| **Mandantentrennung & DSGVO** | Anwendungsfilter (fehleranfällig) | Postgres Row-Level Security (RLS) | Garantierte Datenisolation auf Datenbankebene |

Detaillierte ROI-Kalkulationen, Payback-Perioden und Rollout-Phasen sind im Strategiedokument [`BUSINESS_CASE_AND_TRANSFORMATION.md`](./BUSINESS_CASE_AND_TRANSFORMATION.md) dokumentiert.

---

## 🚀 Funktionsumfang

* **Automatisierte Vertragsanalyse**: Upload von PDF-Verträgen, Layout-Parsing mit PyMuPDF und strukturierte Extraktion wesentlicher Vertragsdaten via Google Gemini LLM.
* **TCO-Berechnung & Tarifvergleich**: Automatische Kalkulation der Gesamtkosten über die Vertragslaufzeit, Identifikation von Boni, Preiserhöhungen und Sparpotenzialen.
* **Interaktiver RAG-Vertrags-Chatbot**: Direkte Beantwortung nutzerspezifischer Fragen zum eigenen Vertrag über eine eingebettete KI-Schnittstelle.
* **Rechtliche Aktionen & Outbox-Muster**: Generierung rechtskonformer Kündigungs- und Widerspruchsschreiben als PDF (OpenHTMLToPDF) mit automatisiertem Versand über einen transaktionalen Outbox-Worker.
* **Echtes Multi-Tenancy (RLS)**: Strikte Datenisolierung auf PostgreSQL-Engine-Ebene (`FORCE ROW LEVEL SECURITY`) kombiniert mit feingranularer IDOR-Validierung im Anwendungscode.
* **Operations Control Center (OCC)**: Isoliertes PWA-Dashboard für Systemmetriken, KI-Latenzen, Token-Kosten und Mandantenstatistiken ohne geteilte Sessions.

---

## 🏛️ Monorepo-Architektur

```
01_b2c_module/
├── 02_b2c-contractchecker-spring/   # Java 21 / Spring Boot 3 Web-App (MVC, Thymeleaf, HTMX, RLS)
├── 03_b2c-ai-gateway/               # Python 3.11 / FastAPI Service (PyMuPDF, Gemini, Instructor)
├── 04_ops-control-center/           # Operations Dashboard (Static PWA via Caddy, Zero-Dependencies)
├── helm/b2c-platform/               # Produktionsreife Helm-Charts für Google Kubernetes Engine (GKE)
├── setup-base/                      # Bootstrap-Skripte für GCP (Workload Identity Federation, GCS)
├── devlocal                         # Zentrales, portables POSIX-Entwickler-CLI-Werkzeug
├── architecture.md                  # Detaillierte Systemarchitektur & Datenflüsse
├── ARCHITECTURE_GUIDELINES.md       # Technische Richtlinien & Qualitätsstandards
└── DEPLOYMENT.md                    # Kubernetes, Helm & Produktionsbetrieb
```

---

## ⚡ Schnellstart mit `./devlocal`

Die gesamte lokale Entwicklung wird pragmatisch über das Skript `./devlocal` gesteuert.

### 1. Voraussetzungen
* **Docker & Docker Compose** (z. B. Docker Desktop, Colima oder OrbStack)
* **Java 21 JDK** (z. B. Eclipse Temurin)
* **Astral uv** (Moderner, schneller Python Package Manager)

### 2. Onboarding & Initialisierung
```bash
# 1. Systemdiagnose ausführen (prüft Docker, Java, uv)
./devlocal doctor

# 2. Umgebung einrichten (.env anlegen, Python-Dependencies via uv synchronisieren)
./devlocal setup
```

Tragen Sie Ihren **`GEMINI_API_KEY`** in `03_b2c-ai-gateway/.env` ein.

### 3. Entwicklungsumgebung starten
```bash
./devlocal start
```
Dieser Befehl startet:
1. Lokale PostgreSQL-Datenbank (Port `5434`) mit RLS-Support.
2. MinIO S3 Object Storage (Port `9000` / Console `9001`) und erzeugt den Bucket `b2c-contracts`.
3. FastAPI AI-Gateway (Port `8000`) im Hintergrund.
4. Spring Boot Backend (Port `8080`) im Vordergrund inklusive Flyway-Migrationen.

### 4. Tests ausführen
```bash
./devlocal test
```
Führt die Java Spring Boot Tests und die Python AI-Gateway Tests gegen eine autarke, temporäre Test-Postgres-Instanz (Port `5433`) aus.

---

## 🔌 Services & Port-Übersicht

| Service | Komponente | Lokaler Port | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Kundenportal** | Spring Boot 3 Web | [`http://localhost:8080`](http://localhost:8080) | Hauptoberfläche für Nutzer (Thymeleaf + HTMX) |
| **Actuator / Health** | Spring Boot Management | [`http://localhost:8081/actuator/health`](http://localhost:8081/actuator/health) | Interne Health- & Prometheus-Endpunkte |
| **AI-Gateway** | FastAPI | [`http://localhost:8000`](http://localhost:8000) | KI-Pipeline (`/docs` im Dev-Modus) |
| **Ops Control Center** | Caddy / Static PWA | [`http://localhost:8090`](http://localhost:8090) | Administratives Monitoring-Cockpit |
| **PostgreSQL** | Relationale Datenbank | `localhost:5434` (Dev) / `5432` (Docker intern) | Datenbank mit erzwungenem RLS |
| **MinIO API** | S3 Object Storage | `http://localhost:9000` | S3-kompatible Dateiablage |
| **MinIO Web Console** | MinIO Admin UI | [`http://localhost:9001`](http://localhost:9001) | User: `minioadmin` / Pass: `minioadmin123` |

---

## 🛡️ Sicherheits- & Mandantenarchitektur

Das Projekt folgt einem strikten **Defense-in-Depth** Sicherheitsmodell:

1. **PostgreSQL Row-Level Security (RLS)**:
   * Jede Tabelle mit Mandantenbezug erzwingt RLS (`FORCE ROW LEVEL SECURITY`).
   * Der `TenantAwareDataSource` injiziert die Kontextvariablen `app.current_tenant_id` und `app.current_user_id` transparent bei jedem Verbindungsabruf aus dem Pool.
2. **Objekt-Ownership-Prüfung (IDOR-Prävention)**:
   * Im Controller- und Service-Layer wird die Besitzerschaft jedes Vertrags explizit verifiziert (`verifyContractOwner`).
3. **Transaktionales Outbox-Muster**:
   * Hintergrund-Worker (`LegalActionOutboxWorker`) und Metrik-Endpunkte verwenden einen isolierten, auditierten RLS-Bypass (`TenantContext.setBypassRls(true)`) mit verlässlicher `try-finally`-Bereinigung.
4. **CSRF & Web-Sicherheit**:
   * Vollständiger CSRF-Schutz mit `CookieCsrfTokenRepository.withHttpOnlyFalse()` und nativer HTMX-Integration.
5. **M2M-Sicherheit**:
   * Interne Webhooks zwischen AI-Gateway und Backend sind über `X-Internal-Secret` geschützt.
   * Das Ops Control Center kommuniziert über dedizierte Endpunkte mit `X-Ops-Secret`.

---

## 📚 Dokumentations-Index

* 🏗️ **[Systemarchitektur (`architecture.md`)](./architecture.md)** — Detailliertes Mermaid-Diagramm, Komponenten und End-to-End Datenflüsse.
* 📐 **[Architektur-Leitlinien (`ARCHITECTURE_GUIDELINES.md`)](./ARCHITECTURE_GUIDELINES.md)** — Technische Standards, Best Practices und Entwicklungsregeln.
* 🚢 **[Deployment Guide (`DEPLOYMENT.md`)](./DEPLOYMENT.md)** — Kubernetes (GKE), Helm, Workload Identity Federation und CI/CD.
* 🔒 **[ADR 001: Multi-Tenancy & RLS (`docs/adr/001-multi-tenancy-and-rls.md`)](./docs/adr/001-multi-tenancy-and-rls.md)** — Architekturentscheidung zur Mandantenisolierung.
* 💼 **[Business Case & Transformation (`BUSINESS_CASE_AND_TRANSFORMATION.md`)](./BUSINESS_CASE_AND_TRANSFORMATION.md)** — Quantitativer ROI, Prozessoptimierung und Transformations-Roadmap.
* 📈 **[Go-to-Market Strategie (`GTM_Strategy_Notes.md`)](./GTM_Strategy_Notes.md)** — Zielgruppen (ICPs), B2B2C-Marktpotenzial und Nutzenversprechen.
* ☕ **[Spring Boot Backend Doku (`02_b2c-contractchecker-spring/README.md`)](./02_b2c-contractchecker-spring/README.md)** — Detaillierte Moduldokumentation Backend.
* 🐍 **[AI Gateway Doku (`03_b2c-ai-gateway/README.md`)](./03_b2c-ai-gateway/README.md)** — Detaillierte Moduldokumentation KI-Dienst.
* 🛡️ **[Ops Control Center Doku (`04_ops-control-center/README.md`)](./04_ops-control-center/README.md)** — Detaillierte Moduldokumentation Admin-Cockpit.

---

## 🔄 CI/CD & Deployment

Die Plattform nutzt **GitHub Actions** (`.github/workflows/ci-cd.yml`) für kontinuierliche Qualitätssicherung und Zero-Downtime Deployments:

* **Automatisierte Tests**: Bei jedem Pull Request werden die Java- und Python-Tests auf GitHub Runners ausgeführt.
* **Multi-Stage Docker Builds**: Erstellung schlanker Container-Images für Backend, AI-Gateway und OCC via `docker/build-push-action`.
* **Workload Identity Federation (WIF)**: Sichere, schlüssellose Authentifizierung gegen Google Cloud.
* **Continuous Delivery**: Automatischer Push in die Google Artifact Registry und Bereitstellung auf **Google Kubernetes Engine (GKE)** via Helm (Staging automatisch, Production nach manueller Freigabe).
