# The Nix Roadmap: Vom Tool-Manager zur unzerstörbaren Infrastruktur

Dieses Dokument skizziert die langfristige Vision für das B2C-Projekt (`contractchecker`), wie das Nix-Ökosystem schrittweise ausgebaut werden kann, um von der aktuellen lokalen Entwicklungsumgebung zu einer vollständig deterministischen, sicheren und hochverfügbaren Produktionsarchitektur zu gelangen.

Die Philosophie: **Inkrementelle Adaption.** Jeder Schritt löst ein konkretes Problem, reduziert Chaos und erhöht die Geschmeidigkeit (Developer Experience).

---

## Phase 1: Perfektion der lokalen Entwicklung (Aktueller Fokus)

In dieser Phase ersetzen wir fehleranfällige manuelle Setups durch deklarative Definitionen.

### 1. Die `devShell` & Go-CLI (✅ Abgeschlossen)
*   **Status:** Entwickler nutzen `nix develop` (oder `direnv`) um isolierte, bit-genaue Versionen von Java, Python und System-Tools zu erhalten.
*   **Ergebnis:** "Works on my machine"-Probleme bei der Toolchain sind gelöst. Neue Entwickler sind in < 2 Minuten arbeitsfähig. Bash-Skripte wurden durch eine robuste Go-CLI (`b2c`) ersetzt.

### 2. Native `pre-commit` Hooks (🔜 Nächster logischer Schritt)
*   **Konzept:** Integration des `pre-commit-hooks.nix` Frameworks in die Flake.
*   **Mehrwert:** Bevor ein `git commit` ausgeführt wird, formatiert Nix den Code (`ruff` für Python, `spotless` für Java) in einer isolierten Sandbox.
*   **Ergebnis:** Keine CI-Fehlschläge mehr aufgrund von Formatierungs- oder Linter-Fehlern. Der Code-Standard wird hart erzwungen, bevor er das Entwickler-Gerät verlässt.

### 3. Home Manager Integration (Optional)
*   **Konzept:** Verwaltung der IDEs (VS Code / IntelliJ) und deren Plugins (SonarLint, Sprachextensions) direkt über Nix.
*   **Mehrwert:** Nicht nur die Compiler, sondern die gesamte Entwicklungsumgebung ist für das gesamte Team standardisiert.

---

## Phase 2: Die Supply Chain absichern (Der "Nix Build")

Bisher delegiert Nix das Bauen an Maven und `uv`. In dieser Phase übernimmt Nix die Kontrolle über den gesamten Build-Prozess.

### 1. Deterministische Derivations für Java & Python
*   **Konzept:** Die `pom.xml` und `uv.lock` werden in Nix "Derivations" übersetzt. Nix blockiert während des Builds den Internetzugang.
*   **Mehrwert:** Verhindert Supply-Chain-Angriffe (z.B. manipulierte externe Abhängigkeiten). Ein Build, der heute funktioniert, wird in 5 Jahren mathematisch garantiert exakt so funktionieren, da alle Abhängigkeiten mit kryptografischen Hashes verankert sind.

### 2. Cachix (Der Team-Turbo)
*   **Konzept:** Ein binärer Cache für die Nix-Builds.
*   **Mehrwert:** Wenn die CI-Pipeline den Code bereits gebaut hat, lädt der Entwickler das kompilierte Ergebnis in Sekundenbruchteilen aus dem Cache herunter, anstatt Minuten mit dem lokalen Kompilieren zu verbringen.

---

## Phase 3: Unzerstörbare Docker-Images für Kubernetes

Diese Phase hebt die Sicherheit (DevSecOps) des B2C-Projekts auf das Level von Tech-Giganten.

### 1. `pkgs.dockerTools` (Abschaffung von Dockerfiles)
*   **Konzept:** Dockerfiles (z.B. `FROM ubuntu` oder `FROM alpine`) werden komplett abgeschafft. Nix generiert OCI-kompatible Container-Images direkt aus den gebauten Derivations (Phase 2).
*   **Mehrwert (Security):** Die resultierenden Images sind echte "Scratch"-Container. Sie enthalten **nur** die Anwendung (z.B. JVM + .jar) und die exakt benötigten C-Libraries. 
*   **Ergebnis:** Es gibt keine Shell (`bash`), keine Paketmanager (`apt`) und keine Linux-Utilities (`curl`). Die Angriffsfläche für Remote Code Execution (RCE) sinkt auf nahezu null. CVE-Scans (Trivy/Snyk) werden extrem sauber.

### 2. Kubernetes Integration
*   Die durch Nix gebauten extrem sicheren Container werden weiterhin über Standard-Helm-Charts auf unsere Kubernetes-Cluster (GCP/AWS) ausgerollt. Kubernetes orchestriert, Nix liefert die perfekten Artefakte.

---

## Phase 4: NixOS für Operations & Server

Die Königsdisziplin für den Betrieb von Infrastruktur (Standalone-Server, Gateways oder VPS).

### 1. NixOS statt Ubuntu/Debian
*   **Konzept:** Statt Server manuell (oder per Ansible) zu konfigurieren, wird das gesamte Betriebssystem (Nginx, Postgres, User-Management, Zertifikate) deklarativ in einer Nix-Datei beschrieben.
*   **Mehrwert:** Es gibt keinen "Configuration Drift" (schleichende Server-Verrottung). Wenn ein VPS ausfällt, wird ein neuer gestartet und die Nix-Konfiguration angewendet. Der Server ist in 3 Minuten ein 1:1 Klon des vorherigen.

### 2. Furchtlose Rollbacks
*   **Konzept:** Jede Änderung am NixOS-System generiert eine neue "Generation" im Bootloader.
*   **Mehrwert:** Wenn ein Deployment (z.B. an einem Freitagabend) fehlschlägt oder der Server nach einem Update nicht mehr erreichbar ist, wählt man beim Neustart die vorherige Generation. Das System ist sofort und auf das Bit genau wieder im vorherigen, funktionierenden Zustand.

---

## Fazit: Der Paradigmenwechsel

Der konsequente Ausbau des Nix-Ökosystems bedeutet einen Wechsel von "Imperativer Administration" (Schritt-für-Schritt Befehle) zu "Deklarativer Infrastruktur" (Beschreibung des gewünschten Endzustands).

**Der größte Gewinn ist Geschmeidigkeit:**
- Keine "Feuerwehreinsätze" mehr wegen mysteriöser Umgebungsfehler.
- Totales Vertrauen in Deployments.
- Maximale Sicherheit im B2C-Umfeld durch drastisch reduzierte Angriffsflächen in Produktion.