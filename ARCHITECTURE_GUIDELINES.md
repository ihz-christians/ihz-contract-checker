# Architektur & System-Richtlinien (Kundenschutz 4.0)

Dieses Dokument beschreibt die Architektur, die Verantwortlichkeiten der einzelnen Systemkomponenten und die detaillierten Richtlinien für die Verarbeitung von Verträgen (B2C Contract Checker).

## 1. Systemübersicht

Die Architektur basiert auf einer sauberen Trennung der Verantwortlichkeiten (Separation of Concerns). Das System denkt in Zuständigkeiten, nicht nur in Programmiersprachen.

```mermaid
graph TD
    subgraph "Frontend / User"
        UI[B2C Web App (Thymeleaf)]
    end

    subgraph "Core System Java / Spring Boot"
        Controller[Web API Controller]
        TaskMgr[Analysis Task Workflow]
        Rules[TCO Calculation & Rule Engine]
        Sec[Spring Security / Keycloak]
    end

    subgraph "AI & Data Gateway Python / FastAPI"
        Pipeline[Document Pipeline Controller]
        Parser[Layout Parser / OCR]
        Validator[Pydantic Validation]
        LLM_SDK[LLM Orchestration]
    end

    subgraph "Infrastructure"
        DB[(PostgreSQL RLS)]
        S3[(Object Storage)]
        Gemini((Gemini 2.5 API))
    end

    UI -->|Upload PDF| Controller
    Controller -->|Save PDF| S3
    Controller -->|Create Task| DB
    Controller -->|Start Async Job| Pipeline
    
    Pipeline -->|Download PDF| S3
    Pipeline -->|Extract Layout| Parser
    Parser -->|Send clean Text| LLM_SDK
    LLM_SDK <-->|Query| Gemini
    LLM_SDK -->|Raw JSON| Validator
    Validator -->|Clean JSON & Audit| Pipeline
    
    Pipeline -.->|Webhook Task Done| TaskMgr
    TaskMgr -->|Calculate Price| Rules
    TaskMgr -->|Update Task| DB
```

---

## 2. Die Schichten-Architektur

### 2.1 Spring Boot: Der stabile Kern ("System of Record")
Spring Boot hält alles, was geschäftskritisch und nachvollziehbar ist. Es verwaltet den Prozess, trifft die Entscheidungen auf Basis der AI-Fakten und sorgt für Compliance.

**Verantwortlichkeiten:**
- User Management & Tenant System (PostgreSQL mit Row Level Security)
- Security (Rollen, Rechte, Login)
- Vertragsverwaltung & Workflow-Steuerung
- Business-Regeln & Audit

**Goldene Regel:** Spring Boot entscheidet, nicht die AI!
*Falsch:* AI sagt: "Der Vertrag ist schlecht."
*Richtig:* AI liefert Fakten (`Laufzeit: 36 Monate`, `Kündigungsfrist: 6 Monate`). Spring Boot wendet Regeln an (z.B. Laufzeit > 24 Monate = Warnung) und berechnet den finalen Score.

### 2.2 Python: Der AI Intelligence Layer
Python ist das "Gehirn" des Systems. Es dient als **AI Gateway**, um den Core (Spring Boot) von direkten LLM-Abhängigkeiten zu entkoppeln.

**Verantwortlichkeiten:**
- Dokumentverständnis & OCR Pipeline
- Embeddings & Vector Storage
- Retrieval-Augmented Generation (RAG)
- LLM Orchestrierung & Evaluation

**Vorteil:** Durch das Python Gateway können LLMs (Gemini, Claude, GPT) jederzeit ausgetauscht werden, ohne den stabilen Spring Boot Kern anfassen zu müssen.

### 2.3 Rust: High Performance Engine (Optional / Zukunft)
Rust wird nicht als "AI Sprache" genutzt, sondern für ressourcenintensive Compliance- und Normalisierungsaufgaben.
- **Document Normalization:** Schnelles PDF Parsing, Hashing, Duplicate Detection bei großen Mengen (z.B. 100.000 Verträge).
- **Rule Engine:** Auswertung der AI-Fakten in Millisekunden.
- **Datenschutz (PII):** Maskierung von Namen/Adressen vor der Übergabe an das LLM.

---

## 3. Die Dokumenten-Pipeline (Parsing)
Die Qualität der AI hängt zu 80% davon ab, wie sauber die Eingangsdaten sind. PDFs dürfen **niemals direkt an das LLM** geschickt werden.

### Stufe 1: Dokumenten-Klassifizierung
Prüfen: Ist es ein echtes Text-PDF, ein Scan, ein Foto oder ein gemischtes Dokument?

### Stufe 2: Text-Extraktion (vor OCR)
Bei echten PDFs wird der Text Layer ausgelesen. Dabei ist es essenziell, **Positionen (x, y) und Seiteninformationen** zu behalten, um das Layout später rekonstruieren zu können.

### Stufe 3: OCR (Nur als Fallback)
Nur bei Bildern/Scans wird OCR eingesetzt (z.B. Google Document AI, Azure, oder Open Source wie Tesseract/PaddleOCR). Es müssen Wortpositionen, Zeilen und Tabellen erkannt werden.

### Stufe 4: Layout Reconstruction & Tabellen
Das Layout muss erhalten bleiben. Normale Text-Extraktion zerstört Tabellen.
Ein "Arbeitspreis 35 ct/kWh" muss strukturiert erkannt werden, anstatt als unlesbarer Fließtext beim LLM zu landen.

### Stufe 5: Normalisierung
Kopfzeilen, Fußzeilen und Logos werden entfernt, echte Vertragsinhalte bleiben erhalten (basierend auf festen Regeln, nicht blind löschen).

### Stufe 6: Struktur-Extraktion
Aus unstrukturiertem Text werden Klauseln extrahiert.

### Stufe 7: Chunking für RAG
Für den Chatbot werden die Verträge in referenzierbare Chunks (mit Seitenangabe und Abschnitt) zerteilt und in eine Vektor-Datenbank geladen.

---

## 4. Multi-LLM Strategie
Ein einziges großes Modell für alles zu verwenden, ist ineffizient und teuer.

1. **Stufe 1 (Extraktion):** Ein günstigeres Modell extrahiert strukturierte Fakten ("Finde Klauseln").
2. **Stufe 2 (Bewertung):** Ein starkes Modell (z.B. Gemini 2.5) wird nur für komplexe Zusammenfassungen oder spezifische Erklärungen genutzt.
3. **Stufe 3 (Chatbot):** Ein RAG-Ansatz kombiniert die Vektorsuche mit einem LLM zur präzisen Beantwortung von Nutzerfragen ("Auf Seite 4 steht...").

---

## 5. Branchenspezifische Daten (B2C)
Das Parsing muss auf die wichtigsten B2C-Vertragsarten spezialisiert sein:
- **Strom/Gas:** Anbieter, Tarifname, Verbrauch, Arbeitspreis, Grundpreis, Bonus, Laufzeit, Kündigungsfrist, automatische Verlängerung.
- **Telekommunikation:** Mindestlaufzeit, Routerkosten, Datenvolumen, Preiserhöhung, Kündigung.

---

## 6. Qualitätssicherung & Auditierbarkeit (Compliance)
Das System muss 100% nachvollziehbar sein ("Warum kam dieses Ergebnis zustande?").

**Jeder Schritt der Pipeline wird gespeichert:**
1. `original.pdf`
2. `extracted_text.json`
3. `layout.json`
4. `structured_contract.json`
5. `ai_analysis.json`
6. `final_score.json`

In der Datenbank (Spring Boot) wird exakt dokumentiert:
`analysis_id`, `contract_id`, `model_used`, `prompt_version`, `timestamp`, `ai_result`, `rule_result`, `final_score`.

**Berechnung und Scoring erfolgen NIEMALS durch das LLM**, sondern deterministisch in Spring Boot (bzw. der Rule Engine) auf Basis der vom LLM gelieferten Fakten.
