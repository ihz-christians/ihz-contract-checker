# 📋 B2C Contract Checker

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

Eine praktische Web-Anwendung zur automatisierten Prüfung und Verwaltung von Verbraucherverträgen (z. B. Strom, Gas oder Handyverträge).

Das Projekt entstand als **praxisnahes Showcase-Projekt zur Prozessdigitalisierung**: Es zeigt, wie man manuelle, papier- und PDF-lastige Abläufe im Kundenservice und Vertrieb durch moderne Software und gezielten KI-Einsatz spürbar vereinfachen und beschleunigen kann.

---

## 📑 Inhaltsverzeichnis

1. [Warum dieses Projekt? (Praxis-Hintergrund)](#-warum-dieses-projekt-praxis-hintergrund)
2. [Was das System kann](#-was-das-system-kann)
3. [Aufbau der Anwendung](#-aufbau-der-anwendung)
4. [Schnellstart mit `./devlocal`](#-schnellstart-mit-devlocal)
5. [Services & Port-Übersicht](#-services--port-übersicht)
6. [Sicherheit & Datenschutz](#-sicherheit--datenschutz)
7. [Dokumentations-Index](#-dokumentations-index)
8. [Qualitätssicherung & CI/CD](#-qualitätssicherung--cicd)

---

## 💡 Warum dieses Projekt? (Praxis-Hintergrund)

Wer schon einmal versucht hat, Verträge von verschiedenen Anbietern zu vergleichen, kennt das Problem: Wichtige Details wie Kündigungsfristen, Grundpreise oder Klauseln zur automatischen Verlängerung verstecken sich oft im Kleingedruckten. Im Kundenservice oder bei Beratungsstellen werden diese Dokumente meist noch per Hand durchgesehen und in Excel-Tabellen abgetippt.

**Der Lösungsansatz in diesem Projekt:**
* **Kein mühsames Abtippen mehr:** Das Dokument wird als PDF hochgeladen, automatisch ausgelesen und übersichtlich zusammengefasst.
* **Kosten auf einen Blick:** Laufende Kosten und Kündigungsfristen werden sofort berechnet, statt manuell in Tabellen kalkuliert werden zu müssen.
* **Direkt handeln:** Wenn der Vertrag gekündigt oder gewechselt werden soll, generiert das System mit einem Klick ein passendes Kündigungsschreiben als PDF.
* **Fragen stellen:** Über einen integrierten Chat-Assistenten kann man konkrete Fragen zum hochgeladenen Vertrag stellen (z. B. *„Gibt es eine Preisgarantie?“*).

Ausführliche Überlegungen zum Praxisnutzen sind im Dokument [`PROJEKTKONZEPT.md`](./PROJEKTKONZEPT.md) beschrieben.

---

## 🚀 Was das System kann

* **PDF-Verträge automatisch auslesen**: Vertragsdaten (Laufzeiten, Fristen, Arbeitspreise, Boni) werden per Texterkennung und KI-Unterstützung (Gemini) direkt aus dem PDF extrahiert.
* **Gesamtkosten & Fristen berechnen**: Automatische Berechnung der monatlichen und jährlichen Kosten über die Mindestvertragslaufzeit sowie übersichtliche Anzeige der Kündigungsfrist.
* **Kündigungsschreiben als PDF erstellen**: Fertig formatiertes Kündigungsschreiben mit den korrekten Vertragsdaten auf Knopfdruck generieren und herunterladen.
* **Vertrags-Chat**: Bei Unklarheiten direkt im Browser Fragen zum Vertrag stellen.
* **Saubere Mandantentrennung**: Schutz der Kundendaten direkt auf Datenbank-Ebene (PostgreSQL Row-Level Security), damit Berater oder Mandanten nur ihre eigenen Daten sehen.
* **Einfaches Admin-Cockpit**: Schnelle Übersicht über Verarbeitungszeiten und Systemstatus.

---

## 🏛️ Aufbau der Anwendung

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

## 🔒 Sicherheit & Datenschutz

Weil Verträge persönliche und sensible Daten enthalten, wurden von Anfang an saubere Standards eingehalten:

1. **Sichere Mandantentrennung**:
   * Über PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`) wird garantiert, dass Nutzer und Mandanten strikt nur auf ihre eigenen Daten zugreifen können – direkt auf Datenbank-Ebene erzwungen.
   * Der `TenantAwareDataSource` setzt die Mandanten-ID transparent bei jedem Datenbank-Zugriff.
2. **Besitzer-Prüfung im Code**:
   * Bei jedem Aufruf im Web-Backend wird zusätzlich geprüft, ob der eingeloggte Nutzer tatsächlich der Eigentümer des aufgerufenen Vertrags ist.
3. **Zuverlässige Aufgaben-Verarbeitung**:
   * Kündigungsschreiben und Benachrichtigungen werden über eine interne Aufgaben-Tabelle (Outbox-Muster) abgearbeitet, damit auch bei kurzen Verbindungsproblemen keine Aktion verloren geht.
4. **Schutz der Web-Oberfläche**:
   * Durchgehender CSRF-Schutz und sichere Session-Verwaltung über Spring Security.
5. **Geschützte interne Schnittstellen**:
   * Die Kommunikation zwischen dem KI-Dienst und dem Backend ist über interne Tokens abgesichert.

---

## 📚 Dokumentations-Index

* 💡 **[Projektkonzept & Praxis-Hintergrund (`PROJEKTKONZEPT.md`)](./PROJEKTKONZEPT.md)** — Alltagsproblem, Prozessvergleich und Praxiseinsatz.
* 🏗️ **[Systemarchitektur (`architecture.md`)](./architecture.md)** — Übersicht der Komponenten, Datenflüsse und Schnittstellen.
* 📐 **[Architektur-Leitlinien (`ARCHITECTURE_GUIDELINES.md`)](./ARCHITECTURE_GUIDELINES.md)** — Entwicklungsregeln und Qualitätsstandards.
* ☕ **[Spring Boot Backend Doku (`02_b2c-contractchecker-spring/README.md`)](./02_b2c-contractchecker-spring/README.md)** — Dokumentation des Java-Kerns.
* 🐍 **[AI Gateway Doku (`03_b2c-ai-gateway/README.md`)](./03_b2c-ai-gateway/README.md)** — Dokumentation des Python/FastAPI-Dienstes.
* 🛡️ **[Ops Control Center Doku (`04_ops-control-center/README.md`)](./04_ops-control-center/README.md)** — Dokumentation des Admin-Cockpits.
* 🚢 **[Deployment Guide (`DEPLOYMENT.md`)](./DEPLOYMENT.md)** — Container-Builds und Kubernetes-Setup.

---

## 🔄 Qualitätssicherung & CI/CD

Das Projekt nutzt **GitHub Actions** (`.github/workflows/ci-cd.yml`) für automatisierte Tests und Qualitätskontrolle:

* **Automatisierte Tests**: Bei jedem Push und Pull Request werden sowohl die Java- als auch die Python-Tests vollständig in einer isolierten Test-Umgebung ausgeführt.
* **Gleiche Tests lokal & remote**: Über `./devlocal test` lassen sich exakt dieselben Tests jederzeit lokal auf dem Entwicklungsrechner ausführen.
* **Saubere Containerisierung**: Schlanke Dockerfiles für alle Komponenten ermöglichen einen schnellen und reproduzierbaren Betrieb.
