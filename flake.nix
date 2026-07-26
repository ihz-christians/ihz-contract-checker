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

              # --- Datenbank & DevOps Tools ---
              postgresql_16 # Liefert 'psql' für DB-Abfragen / RLS Tests
              jq            # JSON-Parser für Shell-Skripte (nützlich für APIs)
              git           # Versionskontrolle (notwendig in der Shell)
            ];

            # Dieser Hook wird beim Betreten der Shell ausgeführt
            shellHook = ''
              # Java Home setzen (wichtig für Maven und Spring)
              export JAVA_HOME=${pkgs.jdk21_headless}
              
              echo "================================================="
              echo "🚀 B2C Module Dev Environment (Powered by Nix) 🚀"
              echo "================================================="
              echo "☕ Java:   $(java -version 2>&1 | awk -F '\"' '/version/ {print $2}')"
              echo "🏗️ Maven:  $(mvn --version | head -n 1 | awk '{print $3}')"
              echo "🐍 Python: $(python3 --version)"
              echo "📦 uv:     $(uv --version)"
              echo "🐘 psql:   $(psql --version | awk '{print $3}')"
              echo "================================================="
              echo "💡 Du hast jetzt exakt die benötigten Versionen im Pfad."
            '';
          };
        }
      );
    };
}
