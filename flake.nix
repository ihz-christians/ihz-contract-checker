{
  description = "B2C Module - Deterministic Dev Environment";

  inputs = {
    # Wir nutzen den unstable Channel, um top-aktuelle Tools wie 'uv' zu bekommen
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      # Unterstützte Architekturen (Linux x86/ARM, macOS Intel/M-Chips)
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSystem = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      devShells = forEachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            # Hier definieren wir die exakten Werkzeuge für das gesamte Monorepo
            packages = with pkgs; [
              # --- Java Stack (02_b2c-contractchecker-spring) ---
              jdk21_headless
              maven

              # --- Python Stack (03_b2c-ai-gateway) ---
              python311
              uv

              # --- Go (Für unsere hauseigene B2C CLI) ---
              go
              
              # --- Ops Control Center (04_ops-control-center) ---
              caddy         # Webserver für lokales Testing der PWA

              # --- Datenbank, DevOps & CI Tools ---
              postgresql_16 # Liefert 'psql' für DB-Abfragen / RLS Tests
              kubernetes-helm # Notwendig für 'helm lint' in devlocal.sh
              lsof          # Wird in devlocal.sh für Port-Cleanup benötigt
              jq            # JSON-Parser für Shell-Skripte (nützlich für APIs)
              git           # Versionskontrolle (notwendig in der Shell)
            ];

            # Dieser Hook wird beim Betreten der Shell ausgeführt
            shellHook = ''
              # Java Home setzen (wichtig für Maven und Spring)
              export JAVA_HOME=''${pkgs.jdk21_headless}

              # WICHTIG FÜR MAC: Testcontainers (Java) mitteilen, wo der Docker Socket liegt
              if [ "$(uname)" = "Darwin" ]; then
                export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
                export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE="/var/run/docker.sock"
              fi

              # Mache unsere Go-CLI als Befehl 'b2c' global in der Shell verfügbar
              alias b2c="go run $PWD/tools/b2c-cli/main.go"

              # Farbdefinitionen für Output
              GREEN='\033[0;32m'
              BLUE='\033[0;34m'
              YELLOW='\033[1;33m'
              CYAN='\033[0;36m'
              NC='\033[0m' # No Color

              clear
              echo -e "''${BLUE}╭─────────────────────────────────────────────────────────────╮''${NC}"
              echo -e "''${BLUE}│''${NC}  ''${CYAN}🚀 B2C CONTRACT CHECKER DEV ENVIRONMENT (Powered by Nix)''${NC}  ''${BLUE}│''${NC}"
              echo -e "''${BLUE}╰─────────────────────────────────────────────────────────────╯''${NC}"
              echo ""
              echo -e "''${GREEN}📍 Workspace:''${NC} $PWD"
              echo ""
              
              # Tool-Versionen im Grid darstellen
              printf "''${YELLOW}🛠️  Verfügbare Tools (Deterministisch & Isoliert):''${NC}\n"
              printf "  %-12s %-20s %-12s %-20s\n" "☕ Java:" "$(java -version 2>&1 | awk -F '\"' '/version/ {print $2}')" "🐍 Python:" "$(python3 --version | awk '{print $2}')"
              printf "  %-12s %-20s %-12s %-20s\n" "🏗️  Maven:" "$(mvn --version | head -n 1 | awk '{print $3}')" "📦 uv:" "$(uv --version | awk '{print $2}')"
              printf "  %-12s %-20s %-12s %-20s\n" "🐘 psql:" "$(psql --version | awk '{print $3}')" "🐹 Go:" "$(go version | awk '{print $3}')"
              printf "  %-12s %-20s %-12s %-20s\n" "⛵ Helm:" "$(helm version --short | sed 's/v//')" "🛡️  Caddy:" "$(caddy version | awk '{print $1}')"
              echo ""
              
              echo -e "''${YELLOW}📚 Wichtigste Befehle:''${NC}"
              echo -e "  ''${GREEN}b2c doctor''${NC}   Prüft, ob dein System (Docker, .env) bereit ist"
              echo -e "  ''${GREEN}b2c dev''${NC}      Startet das gesamte B2C System lokal (Backend, AI, PWA)"
              echo -e "  ''${GREEN}b2c test''${NC}     Führt die isolierten CI-Tests aus"
              echo ""
              echo -e "''${CYAN}💡 Hinweis:''${NC} Du befindest dich in einer isolierten Shell. Alles was du hier"
              echo -e "   ausführst, berührt dein Host-Betriebssystem nicht."
              echo ""
            '';
          };
        }
      );
    };
}
