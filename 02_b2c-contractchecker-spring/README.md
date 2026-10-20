# B2C Contract Checker — Spring Boot 3 Core Backend

Das Modul `02_b2c-contractchecker-spring` bildet den **zentralen Anwendungskern** der B2C Contract Checker Plattform. Es verwaltet die Web-Oberfläche, Authentifizierung, Mandantentrennung, Datenbank-Persistenz, asynchrone Outbox-Verarbeitung und PDF-Export-Erstellung.

---

## 🛠️ Technologie-Stack

* **Java Version**: 21 LTS (Modernes Java mit Records, Pattern Matching, Switch Expressions)
* **Framework**: Spring Boot `3.3.1`
* **Sicherheit**: Spring Security 6 (Form-Login für lokale Entwicklung/Testing, Firebase JWT OAuth2 Resource Server, CSRF-Schutz mit `CookieCsrfTokenRepository.withHttpOnlyFalse()`)
* **Persistenz**: Spring Data JPA / Hibernate 6 mit PostgreSQL JSONB-Unterstützung (`@JdbcTypeCode(SqlTypes.JSON)`)
* **Datenbank-Migrationen**: Flyway (`V1` bis `V9` mit PostgreSQL Row-Level Security)
* **UI & Rendering**: Thymeleaf mit `thymeleaf-extras-springsecurity6` und HTMX für reaktive Interaktionen ohne schweres JavaScript-Framework
* **PDF-Generierung**: OpenHTMLToPDF (`openhtmltopdf-pdfbox` 1.0.10) für pixelgenaue Kündigungsschreiben und Auswertungsberichte
* **Object Storage Client**: AWS Java SDK v2 (S3) für MinIO (Dev) und Google Cloud Storage (Prod)

---

## 📁 Paket- und Codestruktur

```
02_b2c-contractchecker-spring/src/main/
├── java/de/ihrezuhauseberatung/contractchecker/
│   ├── config/
│   │   ├── SecurityConfig.java         # Spring Security 6, CSRF, URL-Filter & Asset-Whitelisting
│   │   ├── TenantContext.java          # ThreadLocal Speicher für currentTenant, currentUser & bypassRls
│   │   └── TenantAwareDataSource.java  # JDBC Proxy, der app.current_tenant_id pro Connection setzt
│   ├── controllers/
│   │   ├── AuthController.java         # Login, Registrierung, Passwort-Reset
│   │   ├── DashboardController.java    # Kunden-Dashboard, Vertragsübersicht, Statistiken
│   │   ├── ContractController.java     # Upload, Vergleich, Detailansicht, Löschung (IDOR-geschützt)
│   │   ├── ChatbotController.java      # RAG-Vertrags-Chatbot via HTMX
│   │   ├── ExportController.java       # PDF-Export & E-Mail-Berichte (OpenHTMLToPDF)
│   │   ├── LegalActionController.java  # Kündigungs- und Widerspruchsschreiben
│   │   ├── ProfileController.java      # Kundenprofil & Anschrift
│   │   ├── OpsMetricsController.java   # Systemweite Metriken für OCC (gesichert via X-Ops-Secret)
│   │   ├── EmailWebhookController.java # Inbound E-Mail-Empfang für Verträge
│   │   └── api/
│   │       └── AiWebhookController.java# Callback-Empfang von FastAPI (gesichert via X-Internal-Secret)
│   ├── models/                         # JPA-Entitäten (Tenant, User, Contract, AnalysisTask, LegalAction)
│   ├── repositories/                   # Spring Data JPA Repositories
│   ├── services/                       # Business-Logik (ContractService, LegalActionService, StorageService)
│   └── workers/
│       └── LegalActionOutboxWorker.java# Asynchroner Outbox-Dispatcher mit kontrolliertem RLS-Bypass
└── resources/
    ├── application.yml                 # Zentrale Konfiguration (Profile: dev, prod, stage)
    ├── db/migration/                   # Flyway Migrationsskripte (V1 bis V9)
    ├── static/                         # CSS, Icons, Favicons, Web-Manifest
    └── templates/                      # Thymeleaf HTML-Templates & HTMX Fragmente
```

---

## 🔒 Sicherheits- und Mandantenarchitektur

### 1. PostgreSQL Row-Level Security (RLS)
* Alle Mandantendaten sind auf Datenbankebene isoliert (`ALTER TABLE ... FORCE ROW LEVEL SECURITY`).
* Der `TenantAwareDataSource` injiziert bei jeder Connection:
  ```sql
  SET app.current_tenant_id = '<tenant_uuid>';
  SET app.current_user_id = '<user_uuid>';
  ```

### 2. Doppelte Absicherung: Eigentümer-Prüfung im Controller
Da alle B2C-Endkunden dem Standard-B2C-Mandanten zugeordnet sind, prüft jeder Controller-Endpunkt zusätzlich die Besitzerschaft:
```java
private void verifyContractOwner(Contract contract, CustomUserDetails userDetails) {
    if (!contract.getUser().getId().equals(userDetails.getUserId())) {
        throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
    }
}
```

### 3. Kontrollierter RLS-Bypass für Hintergrund-Worker & Monitoring
Systemweite Komponenten (`LegalActionOutboxWorker`, `OpsMetricsController`) führen administrative Aktionen in einem isolierten Block aus:
```java
TenantContext.setBypassRls(true);
try {
    // Systemweite Verarbeitung...
} finally {
    TenantContext.clear();
}
```

---

## 🚀 Lokale Ausführung & Test

### Mit dem zentralen Entwickler-Skript (empfohlen):
```bash
# Im Monorepo-Root:
./devlocal start   # Startet DB, MinIO, AI-Gateway und Spring Boot
./devlocal test    # Führt Unit- und Integrationstests auf isolierter DB aus
```

### Manuell mit Maven:
```bash
# Entwicklungsprofil starten (setzt voraus, dass PostgreSQL auf Port 5434 und MinIO auf Port 9000 laufen)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Unit- und Integrationstests ausführen (erfordert die Test-PostgreSQL-DB auf Port 5433, siehe ./devlocal test)
./mvnw clean test
```

---

## 🌐 Endpunkte & Ports

* **Web-Portal (HTTP)**: `http://localhost:8080`
* **Management & Actuator**: `http://localhost:8081/actuator/health` (separater interner Port)
* **Ops Metrics API**: `http://localhost:8080/api/admin/ops/metrics` (Header `X-Ops-Secret` erforderlich)
* **AI Webhook Callback**: `http://localhost:8080/api/v1/webhook/ai-callback` (Header `X-Internal-Secret` erforderlich)
