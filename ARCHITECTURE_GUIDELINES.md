# Nix Flakes & AI Runner Architecture

Dieses Dokument beschreibt die Strategie und Architektur für den Einsatz von **Nix Flakes** und **Go-basierten KI-Runnern** im `b2c_module` Monorepo. 

Es dient als Referenz, um zu entscheiden, **wann** Nix eingesetzt wird, **wie** lokale LLM-Runner sicher orchestriert werden und **wo** man bewusst auf andere Technologien (wie Docker-Sandboxes) ausweichen sollte.

---

## 1. Nix Flakes: Die Basis für deterministische Umgebungen

Wir nutzen Nix Flakes als "Single Source of Truth" für unsere Entwicklungs- und CI/CD-Umgebungen. Nix ersetzt *nicht* unsere Paketmanager (Maven, `uv`), sondern liefert die Laufzeitumgebungen und Systemwerkzeuge in garantierten, gehashten Versionen.

### Der aktuelle Stand (Phase 1)
- **Lokal (`nix develop`):** Stellt isoliert Java 21, Python 3.11, PostgreSQL (`psql`), Helm und Go bereit.
- **CI/CD (GitHub Actions):** Nutzt exakt dieselbe `flake.nix` Umgebung für Tests, wodurch "Works on my machine"-Probleme ausgeschlossen sind.

### Wann nutzen wir Nix?
✅ **JA:** Zur Bereitstellung von Toolchains (Compiler, CLIs, Datenbank-Clients).
✅ **JA:** Für konsistente CI/CD Pipelines.
✅ **JA:** Wenn wir garantieren müssen, dass ein Skript auf Mac (ARM), Mac (Intel) und Linux exakt identisch läuft.

❌ **NEIN:** Für das Kompilieren unserer eigenen Docker-Images (`pkgs.dockerTools`). Wir behalten (vorerst) unsere `Dockerfiles` und nutzen Distroless-Images für Sicherheit, um die Nix-Lernkurve für die Anwendungs-Entwickler flach zu halten.
❌ **NEIN:** Wenn wir schnelles Prototyping mit vielen neuen C-basierten Python-Paketen machen (hier behindert der strikte Offline-Zwang von Nix).

---

## 2. Go-Runner Architektur (Die B2C CLI)

Anstelle fehleranfälliger Bash-Skripte (`devlocal.sh`) nutzen wir eine hauseigene, in **Go** geschriebene CLI. Go orchestriert Prozesse (Spring Boot, Docker, FastAPI) robust, plattformunabhängig und ohne Zombie-Prozesse zu hinterlassen.

**Integration mit Nix:**
Die CLI wird nicht global installiert. Sie wird durch den Nix `shellHook` beim Betreten des Repositories automatisch kompiliert und als Alias (`b2c`) zur Verfügung gestellt.

---

## 3. KI-Agenten & LLM-Runner (Local Execution)

Wenn wir in Zukunft lokale KI-Agenten oder LLM-Runner bauen (die Befehle auf den Rechnern der Entwickler oder Servern ausführen), ist Sicherheit das oberste Gebot.

### Architektur-Muster für LLM-Runner

#### Pattern A: Der "Operator" Runner (Go + Nix)
**Ziel:** Ein Agent, der Logs analysiert, Infrastruktur abfragt oder definierte Skripte ausführt.
- **Wie es funktioniert:** Der Go-Runner empfängt Befehle vom LLM (z.B. "Zeig mir die Logs von Postgres"). Der Runner führt diese Befehle in der durch Nix definierten und isolierten Shell aus.
- **Sicherheit:** Maximal. Das LLM kann das Host-System nicht dauerhaft beschädigen. Fehlende Analyse-Tools (`jq`, `rg`) kann Nix on-the-fly bereitstellen, ohne das System zu "verschmutzen".
- **Einsatzort:** Fehlerdiagnose, Read-Only Analysen, Ausführen von in der Flake definierten CI-Checks.

#### Pattern B: Der "Autonomous Developer" Runner (Go + Docker)
**Ziel:** Ein Agent, der neuen Code schreibt, wild neue Abhängigkeiten testet und komplexe Skripte kompiliert.
- **Warum NICHT Nix?** Wenn das LLM autonom neue Pip-Pakete (`uv add ...`) oder Maven-Artefakte hinzufügt, scheitert es an der strikten Hash-Validierung und dem Offline-Zwang von Nix-Builds. Dem LLM Nix-Syntax beizubringen, führt zu massiven Halluzinationen.
- **Wie es stattdessen funktioniert:** Der Go-Runner startet einen **ephemeren (Wegwerf-) Docker-Container** (z.B. `ubuntu:latest`). Das LLM bekommt dort Root-Rechte, kann `apt-get install` nutzen und experimentieren. Nach Abschluss wird nur der generierte Code extrahiert und der Container zerstört.
- **Einsatzort:** Komplexes Refactoring, Testen von neuen KI-Frameworks, Autonome Feature-Entwicklung.

## 5. Das "Holy Grail" Setup: Local LLM Runner mit Go & Nix

Sollten wir KI-Agenten bauen, die auf den Endgeräten der Nutzer oder Entwickler autonom Code ausführen sollen (z.B. für Code-Reviews, Log-Analysen oder Debugging), verwenden wir zwingend die Kombination aus **Go-Runner und Nix-Sandbox**.

### Warum diese Kombination revolutionär ist:

#### A. Die perfekte Sandbox (Sicherheit vor dem LLM)
LLMs machen Fehler (z.B. `rm -rf` am falschen Ort). 
*   **Ohne Nix:** Das LLM verschmutzt das globale System des Users.
*   **Mit Nix:** Der Go-Runner verpackt den Befehl des LLMs in eine flüchtige Nix-Shell (`nix-shell -p python311 --run "python script.py"`). Sobald das Skript durch ist, ist alles wieder weg. Das System des Nutzers bleibt zu 100 % sicher.

#### B. On-the-Fly Tooling (Das LLM rüstet sich selbst aus)
*   Der Go-Runner erlaubt dem LLM, Tools dynamisch anzufordern (z.B. `ffmpeg` oder `jq`). Der Go-Runner lädt diese über Nix in wenigen Sekunden deterministisch herunter, führt den Befehl aus und gibt das Ergebnis zurück. Der Agent hat Zugriff auf über 80.000 Pakete, ohne dass der User sie global installieren muss.

#### C. Deterministischer Kontext (Reduziert Halluzinationen)
*   Das LLM muss nicht raten ("Ist das Ubuntu oder macOS?"). Der System-Prompt teilt dem LLM mit, dass es in einer Nix-Umgebung läuft. Das LLM fordert exakt die benötigten Tools an, was die Erfolgsquote (Success Rate) des Agenten dramatisch steigert.

### Die Architektur-Regeln für den Go-Runner

1. **Kein Nix-Code vom LLM:** LLMs halluzinieren beim Schreiben von Nix-Code. Der Go-Runner abstrahiert Nix vollständig. Das LLM sendet JSON (`{"tool": "nodejs", "version": "18"}`), und der Go-Runner übersetzt das in den Nix-Shell Befehl.
2. **Der System-Prompt:** *"Du bist ein KI-Agent. Du hast keinen direkten Zugriff auf den Host. Fordere die benötigten Pakete aus 'nixpkgs' an, ich stelle sie dir isoliert bereit."*
3. **Die Execution:** Der Go-Runner führt **niemals** direkt `bash -c` aus. Alles wird über `exec.Command("nix", "shell", ...)` gekapselt.
4. **Garbage Collection:** Der Go-Runner muss gelegentlich `nix-collect-garbage` ausführen, um den Speicherplatzbedarf (Disk Bloat) durch die vielen vom LLM ausprobierten Tools zu kontrollieren.

**Fazit:** Dieses Setup ist "Executable AI mit Airbags". Das LLM kann frei experimentieren, das System des Kunden/Entwicklers bleibt unangetastet. Für lokale KI-Agenten ist dies die sicherste und fortschrittlichste Architektur.

1. **Umgebung laden:** Wechsle in den Root-Ordner (`01_b2c_module`) und tippe `nix develop` (oder nutze `direnv`).
2. **Tools nutzen:** Du hast nun exakt die gleichen Versionen von Java, Python etc. wie der Rest des Teams und die CI.
3. **CLI nutzen:** Nutze den Befehl `b2c` (z.B. `b2c dev`), um die Umgebung hochzufahren. Die CLI (Go) kümmert sich um alle Abhängigkeiten und Wartezeiten.
4. **Keine Magie erzwingen:** Nutze für das Programmieren weiterhin deine gewohnten Tools (`uv`, Maven, IntelliJ, VS Code). Nix ist nur das Fundament, nicht der Käfig.