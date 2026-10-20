# B2C Platform Architecture Guidelines

Dieses Dokument beschreibt die Architektur und Leitlinien für das `01_b2c_module` Monorepo.
Der Fokus liegt auf **robuster, wartbarer und pragmatischer Softwareentwicklung** ohne künstliche Komplexität oder unnötige Meta-Tools.

---

## 1. Systemübersicht & Module

Das System ist in klare, entkoppelte Komponenten unterteilt:

```
01_b2c_module/
├── 02_b2c-contractchecker-spring   # Java 21 / Spring Boot 3 Web-App (MVC, Auth, RLS, Outbox)
├── 03_b2c-ai-gateway               # Python / FastAPI Async Pipeline (OCR, LLM Multi-Agent)
├── 04_ops-control-center           # Operations Dashboard (Static Web/PWA)
├── helm/b2c-platform               # Kubernetes Deployment Manifeste (GKE)
├── setup-base/                     # GCP & Workload Identity Federation Bootstrap
└── devlocal                        # Zentrales POSIX-Entwicklerskript
```

---

## 2. Core Service: Spring Boot Backend (`02_b2c-contractchecker-spring`)

* **Framework**: Spring Boot 3.3.x mit Java 21 LTS
* **Architektur**: Spring MVC mit server-seitigem Rendering (Thymeleaf + HTMX) für reaktive UIs ohne schwere Frontend-Frameworks.
* **Sicherheit & Auth**:
  * Spring Security 6 mit Form-Login (lokal/Dev) und OAuth2 Resource Server (JWT, z. B. Firebase / Keycloak).
  * CSRF-Schutz mit `CookieCsrfTokenRepository.withHttpOnlyFalse()` und automatischer HTMX-Integration.
  * Strikte IDOR-Validierung auf Benutzerebene (`verifyContractOwner`) für alle ressourcenbezogenen Endpunkte.
* **Datenbank & Persistenz**:
  * PostgreSQL mit Flyway-Migrationen (`src/main/resources/db/migration/`).
  * PostgreSQL Row-Level Security (RLS) mit `TenantAwareDataSource` und `TenantContext`.
  * Transaktionales Outbox-Muster (`LegalActionOutboxWorker`) für asynchrone Folgeprozesse.
  * PDF-Generierung für Kündigungsschreiben und Exportberichte via OpenHTMLToPDF (CSS3/HTML5).
  * Gesicherter Administrations- und Monitoring-Endpunkt (`/api/admin/ops/metrics`) mit `X-Ops-Secret`.

---

## 3. AI Service: FastAPI AI-Gateway (`03_b2c-ai-gateway`)

* **Framework**: FastAPI mit Python 3.11+ und Astral `uv` als schnellem Package-Manager.
* **Aufgabe**:
  * Asynchrone Dokumentenextraktion (PyMuPDF) und strukturierte Datenanalyse.
  * LLM-Integration über Google Gemini und `instructor` mit strikter Schema-Validierung.
  * Entkoppelte Kommunikation via Webhook-Callbacks an das Spring Boot Backend.
* **Sicherheit**:
  * Abgesicherter M2M-Aufruf über `X-Internal-Secret`.
  * Kein Zugriff auf ungesicherte externe Callback-URLs (SSRF-Prävention).

---

## 4. Lokale Entwicklung (`devlocal`)

Die lokale Entwicklung wird über das einfache, portable Skript `./devlocal` gesteuert:

* **`./devlocal setup`**: Prüft Docker, erstellt `.env`-Dateien und synchronisiert Python-Pakete via `uv`.
* **`./devlocal start`**: Startet Docker-Infrastruktur (PostgreSQL, MinIO), das AI-Gateway und Spring Boot.
* **`./devlocal test`**: Führt Backend- und AI-Gateway-Tests gegen eine isolierte Test-Postgres-Instanz aus.
* **`./devlocal doctor`**: Schnelldiagnose der installierten Toolchains.

---

## 5. Leitlinien für Qualität und Einfachheit

1. **Standard vor Speziallösung**: Verwende die offiziellen Best Practices der Ökosysteme (Maven für Java, `uv` für Python, Docker Compose für lokale Infrastruktur).
2. **Keine unnötigen Abstraktionsschichten**: Vermeide Meta-Tools, proprietäre Zwischen-CLIs oder unausgereifte AST-Graphen.
3. **Echtes Defense-in-Depth**: Sicherheit wird sowohl auf Datenbankebene (RLS) als auch in der Business-Logik (Service-/Controller-Layer) strikt und unabhängig verifiziert.
4. **Deterministische Tests**: Tests müssen reproduzierbar, autark und ohne manuelle Umgebungseingriffe durchlaufen.

---

## 6. Enterprise- & Cloud-Transformations-Zielbild

1. **Datenbank & Persistenz**: 
   * Für lokale Entwicklung und kostengünstige Staging-Cluster nutzt das Setup Container-basierte PostgreSQL-Instanzen mit Persistent Volumes.
   * Für den produktiven Enterprise-Betrieb ist die Migration auf eine voll gemanagte **Google Cloud SQL (PostgreSQL)** Instanz mit Hochverfügbarkeit (HA), automatischen Backups und privatem VPC-Peering vorgesehen.
2. **DSGVO / PII-Datenschutz vor LLM-Verarbeitung**:
   * Vor dem Senden von OCR-Dokumententexten an cloud-basierte LLM-Endpunkte empfiehlt sich in einer Enterprise-Produktionsumgebung eine vorgeschaltete **PII-Anonymisierungs-Pipeline** (z. B. via Microsoft Presidio), um personenbezogene Daten (IBAN, Adressen, Namen) zu maskieren oder zu tokenisieren.
3. **Multi-Tenancy & Skalierung**:
   * Die strikte Mandantentrennung auf DB-Ebene (RLS) schützt vor Datenlecks bei Softwarefehlern. Bei horizontal skalierenden Microservices mit Connection Pooling sollte der Tenant-Kontext über Session-Hooks direkt bei der Transaktionsübernahme gesetzt werden.