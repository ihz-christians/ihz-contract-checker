# 🛡️ Operations Control Center (OCC) — Isolated PWA

> 💡 **Status & Architektur-Kontext**: Dieses Modul ist als **interaktive UI-Konzeptstudie & PWA-Prototyp** konzipiert, um das zukünftige Betriebs- und Kontrollzentrum für Administratoren zu veranschaulichen. Es pollt reale Systemmetriken der Backends ab und demonstriert Pipeline-Überwachung, Interventions-Workflows und System-Simulationen.

Dieses Verzeichnis enthält das **eigenständige Operations Control Center (OCC)** für den B2C Contract Checker. Es wurde als eigenständige, vom Kunden-Portal getrennte Webanwendung konzipiert.

## 🚀 Warum ein eigenständiges System?

1. **Sicherheit durch getrennte Oberflächen**: 
   Das administrative Kontrollzentrum nutzt keine geteilten Sessions oder Passwörter mit dem Kundenportal.
2. **Sicherer Abruf globaler Metriken**: 
   Das B2C-Hauptportal isoliert Daten streng nach Mandanten (`TenantContext`). Ein interner Administrator muss jedoch systemweite Metriken (z. B. Verarbeitungszeiten, Fehlerraten) einsehen können. Die OCC-App fragt dedizierte, durch ein internes Token (`X-Ops-Secret`) geschützte Endpunkte im Spring Boot Backend (`/api/admin/ops/metrics`) und AI-Gateway (`/api/v1/ops/llm-metrics`) ab. Im Backend wird dieser Zugriff kontrolliert in einem sauberen `TenantContext.setBypassRls(true)`-Block mit striktem `try-finally`-Cleanup ausgeführt.
3. **Ausfallsicherheit**: 
   Tritt ein Fehler auf der Kunden-Webseite auf, läuft das Überwachungs-Dashboard unberührt weiter und erlaubt das Einsehen von Systemzuständen.

---

## 🛠️ Technologie-Stack

Um maximale Einfachheit und Wartbarkeit zu gewährleisten, kommt das Dashboard **ohne schwere JavaScript-Build-Pipelines** aus:

* **Vanilla Web Components (ESM)**: Native, vom Browser unterstützte Komponenten ohne Rendering-Frameworks.
* **PWA (Progressive Web App)**: Einfache Web-App, die im Browser direkt läuft und installierbar ist.
* **Tailwind CSS**: Für eine moderne und responsive Dark-Mode-Benutzeroberfläche.
* **Keine externen NPM-Build-Tools**: Kein schwerer `node_modules`-Ordner nötig – sofort im Browser ausführbar.

---

## 🖥️ Hauptfunktionen des Cockpits

1. **Infrastruktur Live-Überwachung**: Kontinuierlicher Ping von Spring-Core, FastAPI AI Gateway, PostgreSQL und MinIO S3 mit Latenz-Tracking und Ausfallsimulation.
2. **Asynchrones Pipeline Board**: Statusübersicht aller asynchronen Extraktionsaufträge (`processing`, `failed`, `ocr_fallback`, `completed`).
3. **Manuelle Intervention & Override**: Ermöglicht es dem Controller bei fehlerhaften PDF-Scans, den Rohtext und die AI-extrahierten Werte direkt im JSON einzusehen, zu korrigieren und direkt an die Rule Engine zurückzusenden.
4. **Token- & Kostenkontrolle**: Echtzeit-Visualisierung der Gemini-Token-Nutzung inklusive einer interaktiven Kosten-Trend-Kurve (SVG Sparklines).
5. **Security & RLS-Guard**: Ein proaktiver Sicherheitswächter, der regelmäßige Berechtigungs-Audits auf der PostgreSQL-Datenbank fährt und Datenlecks im Mandantensystem verhindert.

---

## 📦 Lokaler Start & Installation

Da die App vollständig statisch ist, kann sie mit jedem einfachen Webserver gestartet werden.

### Option 1: Docker Compose / Caddy (Empfohlen)
Im Monorepo-Root ausführen:
```bash
docker compose up -d opscontrol
```
Öffnen Sie anschließend **http://localhost:8090** in Ihrem Browser.

### Option 2: Python HTTP Server (Minimal)
Führen Sie in diesem Verzeichnis einfach Folgendes aus:
```bash
python3 -m http.server 8090
```
Öffnen Sie anschließend **http://localhost:8090** in Ihrem Browser.

### Option 3: Node.js (Static Server)
```bash
npx serve -l 8090 .
```

### 🔑 Authentifizierung (Ops Secret)
Die Anwendung benötigt ein Authentifizierungs-Token zur Kommunikation mit den Backend-Endpunkten:
* **Entwicklung (`localhost`)**: Verwendet automatisch das Standard-Entwicklungs-Secret (`super-secure-ops-token-2026`).
* **Manuelle Übergabe via URL-Parameter**: `http://localhost:8090/?ops_token=<DEIN_GEHEIMES_TOKEN>`. Der Parameter wird automatisch in der `sessionStorage` gespeichert und sauber aus der URL-Leiste entfernt.

### 📱 Als App installieren (PWA)
1. Öffnen Sie die Seite in Chrome, Edge oder Safari.
2. Klicken Sie auf das **Installations-Icon** in der Adressleiste (oder "Zum Home-Bildschirm hinzufügen" auf Mobilgeräten).
3. Das Ops Control Center startet nun in einem **isolierten App-Fenster** direkt aus Ihrem Betriebssystem-Dock!

---

## 🔒 Sicherheitsrichtlinien für Produktion

Das Dashboard darf **niemals öffentlich im Internet** erreichbar sein. 

### Empfohlener Produktions-Deployment-Fluss:
1. **Private Kubernetes-Zone**: Deployment im Namespace `ops-control` (getrennt von `staging` und `production`).
2. **Identity-Aware Proxy (IAP)**: Schützen Sie das Routing über Google Cloud IAP, sodass nur authentifizierte Nutzer Ihres Google Workspace (z.B. `@ihrezuhauseberatung.de`) die Seite überhaupt laden können.
3. **Hardware Keys (MFA)**: Erzwingen Sie die Nutzung von physischen Sicherheitsschlüsseln (Yubikeys) für alle Administratoren.
