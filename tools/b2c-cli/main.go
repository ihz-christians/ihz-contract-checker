package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
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
	fmt.Println("  b2c doctor   - System prüfen (Docker, API Keys)")
	fmt.Println("  b2c dev      - Lokales System starten")
	fmt.Println("  b2c test     - CI-Tests lokal ausführen")
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
	dockerCmd := exec.CommandContext(ctx, "docker", "compose", "-f", "docker-compose.yml", "-f", "docker-compose.dev.yml", "up", "-d")
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
