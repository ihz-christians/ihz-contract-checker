# ADR 001: Mandantenfähigkeit und PostgreSQL Row-Level Security (RLS)

## Status
Angenommen (Accepted)

## Kontext
Die Plattform unterstützt sowohl organisatorische Mandanten (Unternehmen oder Berater mit strikten Vorgaben zur Datentrennung) als auch individuelle Privatnutzer, die persönliche Energie- und Telekommunikationsverträge analysieren.

Eine zentrale architektonische Anforderung ist der verlässliche Schutz vor Datenvermischung bei gleichzeitig guter Testbarkeit und einfacher Wartung.

Ursprünglich wurde PostgreSQL Row-Level Security (RLS) mit sitzungsbasierten Konfigurationsvariablen (`app.current_tenant_id`) eingeführt, um die Isolation direkt auf Datenbankebene zu erzwingen. Eine reine datenbankseitige RLS-Richtlinie, die ausschließlich an `tenant_id` gekoppelt ist, stößt in einer gemischten Umgebung jedoch auf spezifische Herausforderungen:
1. **Gemeinsamer Standard-Mandant**: Alle selbstregistrierten Privatnutzer werden unter einem Standard-Mandanten (`11111111-1111-1111-1111-111111111111`) zusammengefasst, um eine unkontrollierte Mandanteninflation pro Einzelkunde zu verhindern. Wenn die Datenbank-RLS rein mandantenbezogen arbeitet, verhindert sie zwar den Zugriff zwischen verschiedenen Firmenmandanten, isoliert jedoch nicht einzelne Privatkunden innerhalb desselben Mandanten voneinander.
2. **Asynchrone Outbox-Verarbeitung im Hintergrund**: Hintergrund-Worker (wie `@Scheduled`-Outbox-Dispatcher) laufen außerhalb von HTTP-Request-Threads und besitzen initial keinen Mandantenkontext. Unveränderte RLS-Policies würden sämtliche ausstehenden Outbox-Einträge vor den Worker-Queries verbergen.
3. **Zusammenspiel mit Connection-Pooling**: In Web-Anwendungen mit Spring Boot und HikariCP werden Datenbankverbindungen über Transaktionsgrenzen hinweg wiederverwendet. Kontextvariablen, die via `SET app.*` gesetzt werden, müssen pro Checkout und Transaktionsabschluss zuverlässig gesetzt und bereinigt werden.

## Entscheidung
Wir etablieren ein **zweistufiges Sicherheitsmodell**:

### 1. Isolation auf Datenbankebene (Mandantentrennung)
- Erzwungene PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`) bleibt der unveränderliche Schutz für alle persistenten Entitäten (`contracts`, `chunks`, `analysis_tasks`, `legal_actions`, `users`).
- Die Mandantengrenze wird pro Connection-Checkout über `TenantAwareDataSource` basierend auf dem ThreadLocal-`TenantContext` injiziert.
- Keine Datenbankabfrage kann die aktive Mandantengrenze ohne einen expliziten administrativen Bypass (`app.bypass_rls = 'true'`) überschreiten.

### 2. Eigentumsprüfung auf Applikationsebene (Nutzerbezogener Schutz)
- Innerhalb des geteilten Standardmandanten wird der Zugriff auf Objektebene zusätzlich auf Service- und Controller-Ebene durchgesetzt (`verifyContractOwner` / `@PreAuthorize`).
- Controller, die Verträge, rechtliche Aktionen oder Exporte verarbeiten, erzwingen explizit:
  ```java
  if (!contract.getUser().getId().equals(userDetails.getUserId())) {
      throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
  }
  ```
- Dadurch ergänzen sich die Datenbank-RLS und die applikationsseitigen Zugriffskontrollen als zwei voneinander unabhängige Sicherheitsschichten.

### 3. Outbox-Worker & Webhook-Verarbeitung
- Autonome Hintergrund-Worker (`LegalActionOutboxWorker`) agieren mit einem expliziten System-Bypass-Kontext zur Auffindung fälliger Aktionen:
  ```java
  TenantContext.setBypassRls(true);
  try {
      List<LegalAction> pending = legalActionService.fetchPendingActionsWithLock();
      // Aktionen abarbeiten...
  } finally {
      TenantContext.clear();
  }
  ```
- Sobald ein Datensatz übernommen wurde, beschränkt der Worker die nachgelagerte Ausführung explizit auf die `tenant_id` und `user_id` des jeweiligen Eintrags, bevor PDF-Dokumente generiert und versendet werden.
- Interne Webhooks (z. B. vom FastAPI AI-Gateway) authentifizieren sich über ein Secret (`X-Internal-Secret`) und stellen den Mandantenkontext anhand der verifizierten Task-Entität wieder her, bevor benutzerbezogene Daten aktualisiert werden.

## Konsequenzen

### Positiv
- **Garantierte Mandanten-Isolation**: Datenbankabfragen können die Mandantengrenze auf DB-Ebene nicht versehentlich überschreiten.
- **Zuverlässiger Schutz gegen unberechtigte Zugriffe (IDOR)**: Unberechtigte Datenabrufe fremder Verträge werden an allen Endpunkten systematisch unterbunden.
- **Sauberer Lebenszyklus**: Sämtliche RLS-Bypass-Operationen sind zentral gekapselt und durch strikte `try-finally`-Blöcke abgesichert, was ThreadLocal-Leaks verhindert.
- **Operative Zuverlässigkeit**: Hintergrund-Outbox-Worker und asynchrone Pipelines arbeiten deterministisch und blockieren nicht an unvollständigen Session-Kontexten.

### Abwägungen & Gegenmaßnahmen (Trade-offs)
- **Doppelte Prüfpflicht**: Entwickler müssen bei neuen Controllern stets `verifyContractOwner` implementieren. Controller-Integrationstests prüfen explizit, dass Anfragen fremder Benutzer innerhalb desselben B2C-Mandanten mit HTTP 403 Forbidden abgewiesen werden.
