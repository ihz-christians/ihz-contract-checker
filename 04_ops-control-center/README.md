# 🛡️ Operations Control Center (OCC) — Isolated PWA

Dieses Verzeichnis enthält das **eigenständige, hochsichere Operations Control Center (OCC)** für den B2C Contract Checker. Es wurde nach dem **Zero-Trust-Prinzip** als vollständig isoliertes System konzipiert.

## 🚀 Warum ein eigenständiges System?

1. **Sicherheit durch Isolation (Air-Gap)**: 
   Sollte das öffentliche Kunden-Dashboard kompromittiert werden, bleibt das administrative Kontrollzentrum geschützt. Es nutzt keine geteilten Sessions, Passwörter oder Client-Bibliotheken mit dem Hauptportal.
2. **Bypass der Row-Level Security (RLS)**: 
   Das B2C-Hauptportal isoliert Daten streng nach Mandanten (`TenantContext`). Ein globaler Operations Controller muss jedoch systemübergreifende Pipelines einsehen können. Die OCC-App verbindet sich daher über einen speziellen administrativen Datenbank-Kanal (`ops_superuser`), der die RLS-Policies sicher umgeht.
3. **Ausfallsicherheit**: 
   Tritt ein Fehler auf der Hauptseite auf, läuft das Überwachungs- und Kontrollzentrum unberührt weiter und erlaubt manuelle Interventionen und Pipeline-Reparaturen.

---

## 🛠️ Technologie-Stack

Um maximale Sicherheit gegen Supply-Chain-Angriffe zu gewährleisten, verwendet das OCC **keine Frameworks mit tiefen Abhängigkeitsbäumen** (kein React-Build-Prozess, kein Angular, kein Node-Laufzeit-Zwang im Frontend).

* **Vanilla Web Components (ESM)**: Native, vom Browser unterstützte wiederverwendbare Kapselung (Custom Elements) ohne Rendering-Frameworks.
* **PWA (Progressive Web App)**: Service Worker, die ein Offline-Caching ermöglichen und die App auf Mobilgeräten oder Desktops nativ installierbar machen.
* **Tailwind CSS (via CDN)**: Für eine moderne, performante und responsive Dark-Cyberpunk-Benutzeroberfläche.
* **Zero Dependencies**: Keine `node_modules` nötig! Extrem wartungsfreundlich und immun gegen NPM-Schwachstellen.

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

### Option 1: Python HTTP Server (Standard)
Führen Sie in diesem Verzeichnis einfach Folgendes aus:
```bash
python3 -m http.server 8090
```
Öffnen Sie anschließend **http://localhost:8090** in Ihrem Browser.

### Option 2: Node.js (Static Server)
```bash
npx serve .
```

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
