package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
	"time"
)

// ANSI Colors für CLI Output
const (
	Green  = "\033[0;32m"
	Yellow = "\033[1;33m"
	Red    = "\033[0;31m"
	Cyan   = "\033[0;36m"
	Reset  = "\033[0m"
)

func main() {
	if len(os.Args) < 2 {
		printHelp()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "dev":
		runDev()
	case "doctor":
		runDoctor()
	case "test":
		runTest()
	case "db":
		runDb()
	case "graph":
		runGraph()
	case "help":
		printHelp()
	default:
		fmt.Printf(Red+"❌ Unbekannter Befehl: %s\n"+Reset, command)
		printHelp()
	}
}

func printHelp() {
	fmt.Println(Cyan + "\nB2C Contract Checker CLI (v1.0)" + Reset)
	fmt.Println("Verwendung:")
	fmt.Println("  b2c doctor        - System prüfen (Docker, API Keys)")
	fmt.Println("  b2c dev           - Lokales System starten")
	fmt.Println("  b2c test          - CI-Tests lokal ausführen")
	fmt.Println("  b2c db <cmd>      - Lokale SurrealDB verwalten (start, stop, status)")
	fmt.Println("  b2c graph <cmd>   - Graphen synchronisieren (sync)")
	fmt.Println()
}

func runDoctor() {
	fmt.Println(Cyan + "\n🩺 Starte System-Check..." + Reset)

	// Check Docker
	err := exec.Command("docker", "info").Run()
	if err != nil {
		fmt.Println(Red + "❌ Docker Daemon läuft nicht!" + Reset)
	} else {
		fmt.Println(Green + "✅ Docker Daemon ist erreichbar." + Reset)
	}

	// Check Env
	if _, err := os.Stat("03_b2c-ai-gateway/.env"); os.IsNotExist(err) {
		fmt.Println(Yellow + "⚠️  Warnung: 03_b2c-ai-gateway/.env fehlt!" + Reset)
	} else {
		fmt.Println(Green + "✅ AI-Gateway Environment File gefunden." + Reset)
	}

	fmt.Println()
}

func runDev() {
	fmt.Println(Cyan + "\n🚀 Starte B2C Contract Checker Umgebung..." + Reset)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// STRG+C fangen
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		fmt.Println(Yellow + "\n\n🛑 STRG+C erkannt. Beende alle Services sauber..." + Reset)
		cancel()
	}()

	// 1. Docker Compose (Postgres, MinIO etc.)
	fmt.Println(Cyan + "🐳 Starte Infrastruktur (Postgres, MinIO)..." + Reset)

	// Wir übergeben die --env-file, damit Docker Compose keine Warnungen über fehlende Keys wirft
	dockerArgs := []string{"compose", "-f", "docker-compose.yml", "-f", "docker-compose.dev.yml"}
	if _, err := os.Stat("03_b2c-ai-gateway/.env"); err == nil {
		dockerArgs = append(dockerArgs, "--env-file", "03_b2c-ai-gateway/.env")
	}
	dockerArgs = append(dockerArgs, "up", "-d")

	dockerCmd := exec.CommandContext(ctx, "docker", dockerArgs...)
	dockerCmd.Stdout = os.Stdout
	dockerCmd.Stderr = os.Stderr
	if err := dockerCmd.Run(); err != nil {
		fmt.Println(Red+"❌ Fehler beim Starten der Docker-Infrastruktur:", err, Reset)
		return
	}

	// 2. Spring Boot
	fmt.Println(Cyan + "☕ Starte Spring Boot Backend..." + Reset)
	springCmd := exec.CommandContext(ctx, "./mvnw", "spring-boot:run", "-Dspring-boot.run.profiles=dev")
	springCmd.Dir = "02_b2c-contractchecker-spring"
	// Output auskommentiert, damit die Console sauber bleibt
	// springCmd.Stdout = os.Stdout

	if err := springCmd.Start(); err != nil {
		fmt.Println(Red+"❌ Fehler beim Starten von Spring Boot:", err, Reset)
		return
	}

	fmt.Print(Yellow + "⏳ Warte auf Spring Boot (Port 8080)" + Reset)
	if !waitForPort("http://localhost:8080/actuator/health", 60) {
		fmt.Println(Red + "\n❌ Spring Boot ist nicht hochgefahren!" + Reset)
		return
	}
	fmt.Println(Green + "\n✅ Backend ist online! (http://localhost:8080)" + Reset)

	// 3. Warten auf Abbruch
	fmt.Println(Cyan + "\n✨ System läuft! Drücke STRG+C zum Beenden." + Reset)
	<-ctx.Done()

	fmt.Println(Green + "👋 Alle Prozesse wurden sicher beendet." + Reset)
}

func runTest() {
	fmt.Println(Cyan + "\n🧪 Starte isolierte CI/CD Tests..." + Reset)

	// 1. Test-Datenbank hochfahren (ersetzt start-test-db.sh)
	fmt.Println(Yellow + "🐘 Starte temporäre Test-Datenbank auf Port 5433..." + Reset)
	exec.Command("docker", "rm", "-f", "b2c_test_db").Run() // Aufräumen, falls noch was hängt

	dbCmd := exec.Command("docker", "run", "--name", "b2c_test_db", "-p", "5433:5432", "-e", "POSTGRES_PASSWORD=admin", "-d", "postgres:15-alpine")
	if err := dbCmd.Run(); err != nil {
		fmt.Println(Red+"❌ Konnte Test-Datenbank nicht starten:", err, Reset)
		return
	}

	// Sicherstellen, dass DB gelöscht wird, wenn Tests fertig sind
	defer func() {
		fmt.Println(Yellow + "\n🧹 Räume Test-Datenbank auf..." + Reset)
		exec.Command("docker", "rm", "-f", "b2c_test_db").Run()
	}()

	time.Sleep(3 * time.Second) // Kurz warten, bis Postgres intern hochgefahren ist

	fmt.Println(Yellow + "🔧 Konfiguriere App-User für RLS-Tests..." + Reset)
	exec.Command("docker", "exec", "b2c_test_db", "psql", "-U", "postgres", "-c", "CREATE DATABASE testdb;").Run()
	exec.Command("docker", "exec", "b2c_test_db", "psql", "-U", "postgres", "-d", "testdb", "-c", "CREATE USER app_user WITH PASSWORD 'password';").Run()
	exec.Command("docker", "exec", "b2c_test_db", "psql", "-U", "postgres", "-d", "testdb", "-c", "GRANT ALL PRIVILEGES ON DATABASE testdb TO app_user;").Run()
	exec.Command("docker", "exec", "b2c_test_db", "psql", "-U", "postgres", "-d", "testdb", "-c", "ALTER SCHEMA public OWNER TO app_user;").Run()

	// 2. Java Spring Boot Tests
	fmt.Println(Cyan + "\n☕ Führe Java Spring Boot Tests aus..." + Reset)
	mvnCmd := exec.Command("./mvnw", "clean", "test")
	mvnCmd.Dir = "02_b2c-contractchecker-spring"
	mvnCmd.Stdout = os.Stdout
	mvnCmd.Stderr = os.Stderr
	if err := mvnCmd.Run(); err != nil {
		fmt.Println(Red + "❌ Java Tests fehlgeschlagen!" + Reset)
		return
	}
	fmt.Println(Green + "✅ Java Tests erfolgreich!" + Reset)

	// 3. Python AI Gateway Tests
	fmt.Println(Cyan + "\n🐍 Führe Python AI-Gateway Tests aus..." + Reset)
	uvSyncCmd := exec.Command("uv", "sync")
	uvSyncCmd.Dir = "03_b2c-ai-gateway"
	uvSyncCmd.Run()

	pytestCmd := exec.Command("uv", "run", "--package", "b2c-ai-gateway", "pytest")
	pytestCmd.Dir = "03_b2c-ai-gateway"
	pytestCmd.Stdout = os.Stdout
	pytestCmd.Stderr = os.Stderr
	if err := pytestCmd.Run(); err != nil {
		fmt.Println(Red + "❌ Python Tests fehlgeschlagen!" + Reset)
		return
	}
	fmt.Println(Green + "✅ Python Tests erfolgreich!" + Reset)

	fmt.Println(Green + "\n🎉 Alle Tests (Java & Python) wurden erfolgreich bestanden!" + Reset)
}

func waitForPort(url string, maxSeconds int) bool {
	client := http.Client{Timeout: 1 * time.Second}
	for i := 0; i < maxSeconds; i++ {
		resp, err := client.Get(url)
		if err == nil && resp.StatusCode == 200 {
			return true
		}
		time.Sleep(1 * time.Second)
		fmt.Print(".")
	}
	return false
}

// ============================================================================
// AGDD & SurrealDB Integration
// ============================================================================

const schemaQuery = `
-- Bereinige alle alten Tabellen und Kanten, um einen komplett frischen Zustand zu sichern (Zero Noise)
REMOVE TABLE SourceFile;
REMOVE TABLE CodeSymbol;
REMOVE TABLE JavadocMetadata;
REMOVE TABLE NixDerivation;
REMOVE TABLE RestEndpoint;
REMOVE TABLE DbTable;

REMOVE TABLE defined_in;
REMOVE TABLE has_metadata;
REMOVE TABLE built_with;
REMOVE TABLE exposes_api;
REMOVE TABLE queries_table;

-- Definiere die neuen fokussierten Tabellen (Knoten)
DEFINE TABLE SourceFile SCHEMALESS;
DEFINE TABLE CodeSymbol SCHEMALESS;
DEFINE TABLE JavadocMetadata SCHEMALESS;
DEFINE TABLE NixDerivation SCHEMALESS;
DEFINE TABLE RestEndpoint SCHEMALESS;
DEFINE TABLE DbTable SCHEMALESS;

-- Definiere die Beziehungen (Kanten)
DEFINE TABLE defined_in SCHEMALESS TYPE RELATION;
DEFINE TABLE has_metadata SCHEMALESS TYPE RELATION FROM CodeSymbol TO JavadocMetadata;
DEFINE TABLE built_with SCHEMALESS TYPE RELATION FROM SourceFile TO NixDerivation;
DEFINE TABLE exposes_api SCHEMALESS TYPE RELATION FROM CodeSymbol TO RestEndpoint;
DEFINE TABLE queries_table SCHEMALESS TYPE RELATION FROM CodeSymbol TO DbTable;
`

func runDb() {
	if len(os.Args) < 3 {
		fmt.Println(Red + "❌ Bitte Unterbefehl angeben: start, stop, status" + Reset)
		os.Exit(1)
	}
	sub := os.Args[2]
	switch sub {
	case "start":
		startDB()
	case "stop":
		stopDB()
	case "status":
		statusDB()
	default:
		fmt.Printf(Red+"❌ Unbekannter db-Unterbefehl: %s (erwartet: start, stop, status)\n"+Reset, sub)
	}
}

func runGraph() {
	if len(os.Args) < 3 {
		fmt.Println(Red + "❌ Bitte Unterbefehl angeben: sync" + Reset)
		os.Exit(1)
	}
	sub := os.Args[2]
	switch sub {
	case "sync":
		syncGraph()
	default:
		fmt.Printf(Red+"❌ Unbekannter graph-Unterbefehl: %s (erwartet: sync)\n"+Reset, sub)
	}
}

func startDB() {
	if isDBRunning() {
		fmt.Println(Green + "✅ SurrealDB läuft bereits auf http://localhost:8003" + Reset)
		return
	}

	fmt.Println(Cyan + "🌀 Starte lokale SurrealDB Instanz..." + Reset)
	os.MkdirAll(".surrealdb", 0755)

	logFile, err := os.OpenFile(".surrealdb/surreal.log", os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		fmt.Printf(Red+"❌ Konnte Log-Datei nicht erstellen: %v\n"+Reset, err)
		return
	}

	cmd := exec.Command("surreal", "start", "--bind", "127.0.0.1:8003", "--user", "root", "--pass", "root", "surrealkv://.surrealdb/data.db")
	cmd.Stdout = logFile
	cmd.Stderr = logFile

	// Auf Unix/Darwin die Prozessgruppe abtrennen, damit SurrealDB weiterläuft
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}

	err = cmd.Start()
	if err != nil {
		fmt.Printf(Red+"❌ Fehler beim Starten von SurrealDB: %v\n"+Reset, err)
		logFile.Close()
		return
	}

	// PID speichern
	err = os.WriteFile(".surrealdb/surreal.pid", []byte(fmt.Sprintf("%d", cmd.Process.Pid)), 0644)
	if err != nil {
		fmt.Printf(Red+"❌ Konnte PID-Datei nicht schreiben: %v\n"+Reset, err)
	}

	logFile.Close()

	// Kurz warten und prüfen, ob die DB online ist
	fmt.Print(Yellow + "⏳ Warte auf SurrealDB (Port 8003)" + Reset)
	success := false
	for i := 0; i < 10; i++ {
		time.Sleep(500 * time.Millisecond)
		if isDBRunning() {
			success = true
			break
		}
		fmt.Print(".")
	}

	if success {
		fmt.Println(Green + "\n✅ SurrealDB erfolgreich gestartet und bereit auf http://localhost:8003" + Reset)
	} else {
		fmt.Println(Red + "\n❌ SurrealDB konnte nicht rechtzeitig starten. Siehe .surrealdb/surreal.log für Details." + Reset)
	}
}

func stopDB() {
	fmt.Println(Cyan + "🛑 Beende lokale SurrealDB Instanz..." + Reset)
	pidBytes, err := os.ReadFile(".surrealdb/surreal.pid")
	if err != nil {
		fmt.Println(Yellow + "⚠️ Keine PID-Datei gefunden, versuche Prozess per Namen zu beenden..." + Reset)
		_ = exec.Command("pkill", "surreal").Run()
		time.Sleep(500 * time.Millisecond)
		if !isDBRunning() {
			fmt.Println(Green + "✅ SurrealDB wurde beendet." + Reset)
		} else {
			fmt.Println(Red + "❌ SurrealDB konnte nicht beendet werden." + Reset)
		}
		return
	}

	var pid int
	_, err = fmt.Sscanf(string(pidBytes), "%d", &pid)
	if err != nil {
		fmt.Printf(Red+"❌ Ungültige PID-Datei: %v\n"+Reset, err)
		return
	}

	process, err := os.FindProcess(pid)
	if err != nil {
		fmt.Printf(Red+"❌ Konnte Prozess nicht finden: %v\n"+Reset, err)
		return
	}

	err = process.Signal(syscall.SIGTERM)
	if err != nil {
		_ = os.Remove(".surrealdb/surreal.pid")
		fmt.Println(Green + "✅ SurrealDB ist bereits gestoppt." + Reset)
		return
	}

	time.Sleep(500 * time.Millisecond)
	_ = os.Remove(".surrealdb/surreal.pid")
	fmt.Println(Green + "✅ SurrealDB wurde erfolgreich beendet." + Reset)
}

func statusDB() {
	if isDBRunning() {
		fmt.Println(Green + "ℹ️  Status: SurrealDB läuft auf http://localhost:8003" + Reset)
	} else {
		fmt.Println(Yellow + "ℹ️  Status: SurrealDB läuft nicht." + Reset)
	}
}

func isDBRunning() bool {
	client := http.Client{Timeout: 500 * time.Millisecond}
	resp, err := client.Get("http://localhost:8003/health")
	if err == nil && resp.StatusCode == 200 {
		return true
	}
	return false
}

func sendToSurreal(query string) ([]byte, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("POST", "http://localhost:8003/sql", bytes.NewBufferString(query))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth("root", "root")
	req.Header.Set("surreal-ns", "b2c")
	req.Header.Set("surreal-db", "contractchecker")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func syncGraph() {
	if !isDBRunning() {
		fmt.Println(Red + "❌ SurrealDB läuft nicht! Bitte starte sie zuerst mit: b2c db start" + Reset)
		return
	}

	fmt.Println(Cyan + "🚀 Initialisiere SurrealDB Graph Schema..." + Reset)
	_, err := sendToSurreal(schemaQuery)
	if err != nil {
		fmt.Printf(Red+"❌ Fehler bei der Schema-Initialisierung: %v\n"+Reset, err)
		return
	}
	fmt.Println(Green + "✅ Schema-Initialisierung abgeschlossen." + Reset)

	fmt.Println(Cyan + "\n🔍 Scanne Monorepo für statische Analyse..." + Reset)

	var fileCount, symbolCount, jdocCount int

	fmt.Println(Yellow + "❄️  Nix: Verarbeite flake.nix..." + Reset)
	syncNixFlake()

	fmt.Println(Yellow + "🐘 Postgres: Verarbeite Flyway-Migrationen..." + Reset)
	syncPostgresSchema()

	err = filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			dirName := info.Name()
			if dirName == "target" || dirName == ".venv" || dirName == "venv" || dirName == ".git" || dirName == "node_modules" || dirName == ".surrealdb" || dirName == "test" || dirName == "tests" {
				return filepath.SkipDir
			}
			return nil
		}

		if strings.HasPrefix(path, "02_b2c-contractchecker-spring") && strings.HasSuffix(path, ".java") {
			fileCount++
			symbols, jdocs := parseAndSyncJavaFile(path)
			symbolCount += symbols
			jdocCount += jdocs
		}

		if strings.HasPrefix(path, "03_b2c-ai-gateway") && strings.HasSuffix(path, ".py") {
			fileCount++
			symbols, jdocs := parseAndSyncPythonFile(path)
			symbolCount += symbols
			jdocCount += jdocs
		}

		return nil
	})

	if err != nil {
		fmt.Printf(Red+"❌ Fehler beim Scannen des Monorepos: %v\n"+Reset, err)
		return
	}

	fmt.Println(Cyan + "\n📊 Zusammenfassung:" + Reset)
	fmt.Printf("  📂 Verarbeitete Dateien:  %s%d%s\n", Green, fileCount, Reset)
	fmt.Printf("  ✨ Erstellte Symbole:     %s%d%s\n", Green, symbolCount, Reset)
	fmt.Printf("  📝 Javadocs/Docstrings:   %s%d%s\n", Green, jdocCount, Reset)
	fmt.Println(Green + "\n🎉 Graph-Sync erfolgreich abgeschlossen! SurrealDB ist bereit für LLM-Abfragen." + Reset)
}

func syncNixFlake() {
	content, err := os.ReadFile("flake.nix")
	if err != nil {
		return
	}

	re := regexp.MustCompile(`packages = with pkgs; \[\s*([\s\S]*?)\s*\];`)
	matches := re.FindStringSubmatch(string(content))
	if len(matches) < 2 {
		return
	}

	packagesRaw := matches[1]
	lines := strings.Split(packagesRaw, "\n")

	var query strings.Builder
	query.WriteString("BEGIN TRANSACTION;\n")

	query.WriteString("UPSERT SourceFile:['flake.nix'] SET path = 'flake.nix', language = 'nix';\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "//") {
			continue
		}

		parts := strings.Split(line, "#")
		pkgName := strings.TrimSpace(parts[0])
		if pkgName == "" {
			continue
		}

		fields := strings.Fields(pkgName)
		if len(fields) == 0 {
			continue
		}
		pkgName = fields[0]

		id := "nix_pkg_" + pkgName
		query.WriteString(fmt.Sprintf("UPSERT NixDerivation:['%s'] SET name = '%s', version = 'unstable';\n", id, pkgName))
		query.WriteString(fmt.Sprintf("RELATE SourceFile:['flake.nix']->built_with->NixDerivation:['%s'] UNIQUE;\n", id))
	}

	query.WriteString("COMMIT TRANSACTION;\n")
	_, _ = sendToSurreal(query.String())
}

func syncPostgresSchema() {
	migrationDir := "02_b2c-contractchecker-spring/src/main/resources/db/migration"
	files, err := os.ReadDir(migrationDir)
	if err != nil {
		fmt.Printf("  ⚠️  Konnte Migrationsverzeichnis nicht lesen: %v\n", err)
		return
	}

	var query strings.Builder
	query.WriteString("BEGIN TRANSACTION;\n")

	tableRe := regexp.MustCompile(`(?i)CREATE\s+TABLE\s+([A-Za-z0-9_]+)`)
	rlsRe := regexp.MustCompile(`(?i)ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY`)
	policyRe := regexp.MustCompile(`(?i)CREATE\s+POLICY\s+([A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_]+)`)

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		filePath := filepath.Join(migrationDir, file.Name())
		contentBytes, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}
		content := string(contentBytes)

		// File node
		query.WriteString(fmt.Sprintf("UPSERT SourceFile:['%s'] SET path = '%s', language = 'sql';\n", filePath, filePath))

		// Tables
		tables := tableRe.FindAllStringSubmatch(content, -1)
		for _, match := range tables {
			if len(match) < 2 {
				continue
			}
			tblName := match[1]
			tblID := "db_table_" + tblName
			query.WriteString(fmt.Sprintf("UPSERT DbTable:['%s'] SET name = '%s', rls_enabled = false;\n", tblID, tblName))
			query.WriteString(fmt.Sprintf("RELATE DbTable:['%s']->defined_in->SourceFile:['%s'] UNIQUE;\n", tblID, filePath))
		}

		// RLS Alterations
		rlsMatches := rlsRe.FindAllStringSubmatch(content, -1)
		for _, match := range rlsMatches {
			if len(match) < 2 {
				continue
			}
			tblName := match[1]
			tblID := "db_table_" + tblName
			query.WriteString(fmt.Sprintf("UPSERT DbTable:['%s'] SET rls_enabled = true;\n", tblID))
		}

		// Policies
		policyMatches := policyRe.FindAllStringSubmatch(content, -1)
		for _, match := range policyMatches {
			if len(match) < 3 {
				continue
			}
			policyName := match[1]
			tblName := match[2]
			tblID := "db_table_" + tblName
			query.WriteString(fmt.Sprintf("UPSERT DbTable:['%s'] SET rls_policy_name = '%s';\n", tblID, policyName))
		}
	}

	query.WriteString("COMMIT TRANSACTION;\n")
	res, err := sendToSurreal(query.String())
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Senden des SQL-Graphen an SurrealDB: %v\n", err)
	} else {
		// Eventuelle Fehler-Antwort ausgeben
		if strings.Contains(string(res), `"status":"ERR"`) {
			fmt.Printf("  ❌ SurrealDB meldet Fehler beim SQL-Schema Import: %s\n", string(res))
		}
	}
}

func parseAndSyncJavaFile(filePath string) (int, int) {
	fmt.Printf("  ☕ Parse Java: %s\n", filePath)
	contentBytes, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Lesen von %s: %v\n", filePath, err)
		return 0, 0
	}
	content := string(contentBytes)

	escapedPath := strings.ReplaceAll(filePath, "\\", "\\\\")
	fileQuery := fmt.Sprintf("UPSERT SourceFile:['%s'] SET path = '%s', language = 'java';\n", filePath, escapedPath)
	_, err = sendToSurreal(fileQuery)
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Schreiben von SourceFile-Knoten für %s: %v\n", filePath, err)
	}

	var query strings.Builder
	query.WriteString("BEGIN TRANSACTION;\n")

	classRe := regexp.MustCompile(`(?s)(/\*\*(.*?)\*/\s*)?(?:class|interface|record)\s+([A-Za-z0-9_]+)`)
	classMatches := classRe.FindAllStringSubmatch(content, -1)

	var className string
	symbolsCreated := 0
	jdocsCreated := 0

	for _, match := range classMatches {
		if len(match) < 4 {
			continue
		}
		rawJdoc := strings.TrimSpace(match[2])
		name := match[3]
		className = name

		classID := "java_class_" + name
		cleanJdoc := cleanJavadoc(rawJdoc)

		query.WriteString(fmt.Sprintf("UPSERT CodeSymbol:['%s'] SET name = '%s', type = 'class';\n", classID, name))
		query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->SourceFile:['%s'] UNIQUE;\n", classID, filePath))
		symbolsCreated++

		// Verknüpfe Klassen/Repositories mit der entsprechenden PostgreSQL-Tabelle (queries_table)
		if matchedTable := guessPostgresTable(name, content); matchedTable != "" {
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->queries_table->DbTable:['db_table_%s'] UNIQUE;\n", classID, matchedTable))
		}

		if cleanJdoc != "" {
			jdocID := classID + "_jdoc"
			escapedJdoc := escapeString(cleanJdoc)
			secRules := extractSecurityRules(cleanJdoc)
			secRulesJSON, _ := json.Marshal(secRules)

			query.WriteString(fmt.Sprintf("UPSERT JavadocMetadata:['%s'] SET description = '%s', security_rules = %s;\n", jdocID, escapedJdoc, string(secRulesJSON)))
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->has_metadata->JavadocMetadata:['%s'] UNIQUE;\n", classID, jdocID))
			jdocsCreated++
		}
	}

	// Verbesserter, robuster Regexp für Methoden mit optionalem Javadoc-Block davor (unterstützt Annotations und modifiers)
	methodRe := regexp.MustCompile(`(?s)(/\*\*(.*?)\*/\s*)?(?:@[A-Za-z0-9_]+\s*(?:\([^)]*\))?\s*)*(?:public|protected|private|static|final|synchronized|abstract|\s)+[A-Za-z0-9_<>\s\[\]]+(?:\s+)([a-z][A-Za-z0-9_]*)\s*\(([^)]*)\)`)
	methodMatches := methodRe.FindAllStringSubmatch(content, -1)

	for _, match := range methodMatches {
		if len(match) < 5 {
			continue
		}
		rawJdoc := strings.TrimSpace(match[2])
		methodName := match[3]

		if methodName == "if" || methodName == "for" || methodName == "while" || methodName == "switch" || methodName == "return" {
			continue
		}

		methodID := "java_method_" + className + "_" + methodName
		query.WriteString(fmt.Sprintf("UPSERT CodeSymbol:['%s'] SET name = '%s', type = 'method';\n", methodID, methodName))
		query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->SourceFile:['%s'] UNIQUE;\n", methodID, filePath))
		symbolsCreated++

		if className != "" {
			classID := "java_class_" + className
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->CodeSymbol:['%s'] UNIQUE;\n", methodID, classID))
		}

		cleanJdoc := cleanJavadoc(rawJdoc)
		if cleanJdoc != "" {
			jdocID := methodID + "_jdoc"
			escapedJdoc := escapeString(cleanJdoc)
			secRules := extractSecurityRules(cleanJdoc)
			secRulesJSON, _ := json.Marshal(secRules)

			query.WriteString(fmt.Sprintf("UPSERT JavadocMetadata:['%s'] SET description = '%s', security_rules = %s;\n", jdocID, escapedJdoc, string(secRulesJSON)))
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->has_metadata->JavadocMetadata:['%s'] UNIQUE;\n", methodID, jdocID))
			jdocsCreated++
		}
	}

	query.WriteString("COMMIT TRANSACTION;\n")
	_, err = sendToSurreal(query.String())
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Senden des Java-Graphen an SurrealDB für %s: %v\n", filePath, err)
		return 0, 0
	}

	return symbolsCreated, jdocsCreated
}

func parseAndSyncPythonFile(filePath string) (int, int) {
	fmt.Printf("  🐍 Parse Python: %s\n", filePath)
	contentBytes, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Lesen von %s: %v\n", filePath, err)
		return 0, 0
	}
	content := string(contentBytes)

	escapedPath := strings.ReplaceAll(filePath, "\\", "\\\\")
	fileQuery := fmt.Sprintf("UPSERT SourceFile:['%s'] SET path = '%s', language = 'python';\n", filePath, escapedPath)
	_, err = sendToSurreal(fileQuery)
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Schreiben von SourceFile-Knoten für %s: %v\n", filePath, err)
	}

	var query strings.Builder
	query.WriteString("BEGIN TRANSACTION;\n")

	classRe := regexp.MustCompile(`(?m)^class\s+([A-Za-z0-9_]+)(?:\s*\([^)]*\))?\s*:\s*(?:\n\s*"""([\s\S]*?)""")?`)
	classMatches := classRe.FindAllStringSubmatch(content, -1)

	var className string
	symbolsCreated := 0
	jdocsCreated := 0

	for _, match := range classMatches {
		if len(match) < 2 {
			continue
		}
		name := match[1]
		className = name
		rawDoc := ""
		if len(match) > 2 {
			rawDoc = strings.TrimSpace(match[2])
		}

		classID := "python_class_" + name
		query.WriteString(fmt.Sprintf("UPSERT CodeSymbol:['%s'] SET name = '%s', type = 'class';\n", classID, name))
		query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->SourceFile:['%s'] UNIQUE;\n", classID, filePath))
		symbolsCreated++

		if rawDoc != "" {
			jdocID := classID + "_doc"
			escapedDoc := escapeString(rawDoc)
			query.WriteString(fmt.Sprintf("UPSERT JavadocMetadata:['%s'] SET description = '%s';\n", jdocID, escapedDoc))
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->has_metadata->JavadocMetadata:['%s'] UNIQUE;\n", classID, jdocID))
			jdocsCreated++
		}
	}

	funcRe := regexp.MustCompile(`(?m)^\s*def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*:\s*(?:\n\s*"""([\s\S]*?)""")?`)
	funcMatches := funcRe.FindAllStringSubmatch(content, -1)

	for _, match := range funcMatches {
		if len(match) < 2 {
			continue
		}
		name := match[1]
		if strings.HasPrefix(name, "__") && strings.HasSuffix(name, "__") {
			continue
		}

		rawDoc := ""
		if len(match) > 3 {
			rawDoc = strings.TrimSpace(match[3])
		}

		funcID := "python_func_" + className + "_" + name
		query.WriteString(fmt.Sprintf("UPSERT CodeSymbol:['%s'] SET name = '%s', type = 'function';\n", funcID, name))
		query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->SourceFile:['%s'] UNIQUE;\n", funcID, filePath))
		symbolsCreated++

		if className != "" {
			classID := "python_class_" + className
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->defined_in->CodeSymbol:['%s'] UNIQUE;\n", funcID, classID))
		}

		if rawDoc != "" {
			jdocID := funcID + "_doc"
			escapedDoc := escapeString(rawDoc)
			query.WriteString(fmt.Sprintf("UPSERT JavadocMetadata:['%s'] SET description = '%s';\n", jdocID, escapedDoc))
			query.WriteString(fmt.Sprintf("RELATE CodeSymbol:['%s']->has_metadata->JavadocMetadata:['%s'] UNIQUE;\n", funcID, jdocID))
			jdocsCreated++
		}
	}

	query.WriteString("COMMIT TRANSACTION;\n")
	_, err = sendToSurreal(query.String())
	if err != nil {
		fmt.Printf("  ❌ Fehler beim Senden des Python-Graphen an SurrealDB für %s: %v\n", filePath, err)
		return 0, 0
	}

	return symbolsCreated, jdocsCreated
}

func guessPostgresTable(className string, content string) string {
	// 1. Suche nach JPA @Table(name = "...") Annotationen
	re := regexp.MustCompile(`@Table\s*\(\s*name\s*=\s*"([^"]+)"`)
	matches := re.FindStringSubmatch(content)
	if len(matches) > 1 {
		return matches[1]
	}

	// 2. Fallback auf standardisierte Namenskonventionen (singular/plural)
	name := strings.ToLower(className)
	switch {
	case strings.Contains(name, "user"):
		return "users"
	case strings.Contains(name, "contract"):
		return "contracts"
	case strings.Contains(name, "analysistask") || strings.Contains(name, "analysis_task"):
		return "analysis_tasks"
	case strings.Contains(name, "chunk"):
		return "chunks"
	case strings.Contains(name, "tenant"):
		return "tenants"
	case strings.Contains(name, "role"):
		return "roles"
	case strings.Contains(name, "legalaction") || strings.Contains(name, "legal_action"):
		return "legal_actions"
	case strings.Contains(name, "passwordreset") || strings.Contains(name, "password_reset"):
		return "password_reset_tokens"
	}
	return ""
}

func cleanJavadoc(raw string) string {
	if raw == "" {
		return ""
	}
	lines := strings.Split(raw, "\n")
	var cleaned []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		line = strings.TrimPrefix(line, "*")
		line = strings.TrimSpace(line)
		if line != "" {
			cleaned = append(cleaned, line)
		}
	}
	return strings.Join(cleaned, " ")
}

func extractSecurityRules(jdoc string) []string {
	var rules []string
	re := regexp.MustCompile(`@security\s+([^\n]+)`)
	matches := re.FindAllStringSubmatch(jdoc, -1)
	for _, match := range matches {
		if len(match) > 1 {
			rules = append(rules, strings.TrimSpace(match[1]))
		}
	}
	return rules
}

func escapeString(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "'", "\\'")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", "")
	return s
}
