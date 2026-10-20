# ADR 001: Mandantenfähigkeit, PostgreSQL Row-Level Security (RLS) und Defense-in-Depth

## Status
Angenommen (Accepted)

## Kontext
Die Plattform unterstützt sowohl organisatorische B2B-Kunden (Unternehmensmandanten mit strikten vertraglichen und regulatorischen Vorgaben zur Datentrennung) als auch individuelle B2C-Endverbraucher (selbstregistrierte Privatnutzer, die persönliche Energie- und Telekommunikationsverträge analysieren).

Eine zentrale architektonische Anforderung ist der garantierte Ausschluss jeglicher mandantenübergreifender Datenkontamination bei gleichzeitig hoher Entwicklungsgeschwindigkeit, Testbarkeit und operativer Einfachheit.

Ursprünglich wurde PostgreSQL Row-Level Security (RLS) mit sitzungsbasierten Konfigurationsvariablen (`app.current_tenant_id`) eingeführt, um die Isolation direkt auf Datenbankebene zu erzwingen. Eine reine datenbankseitige RLS-Richtlinie, die ausschließlich an `tenant_id` gekoppelt ist, stößt in einer hybriden B2B/B2C-Architektur jedoch auf spezifische Herausforderungen:
1. **Gemeinsamer B2C-Mandant**: Alle selbstregistrierten B2C-Verbraucher werden unter einem Standard-B2C-Mandanten (`11111111-1111-1111-1111-111111111111`) zusammengefasst, um eine unkontrollierte Mandanteninflation pro Einzelkunde zu verhindern. Wenn die Datenbank-RLS rein mandantenbezogen arbeitet, verhindert sie zwar den Zugriff zwischen verschiedenen Mandanten, isoliert jedoch nicht einzelne B2C-Kunden innerhalb desselben Mandanten voneinander.
2. **Asynchrone Outbox-Verarbeitung im Hintergrund**: Hintergrund-Worker (wie `@Scheduled`-Outbox-Dispatcher) laufen außerhalb von HTTP-Request-Threads und besitzen initial keinen Mandantenkontext. Unveränderte RLS-Policies würden sämtliche ausstehenden Outbox-Einträge vor den Worker-Queries verbergen.
3. **Zusammenspiel mit Connection-Pooling**: In hochperformanten Architekturen mit Spring Boot und HikariCP werden Datenbankverbindungen über Transaktionsgrenzen hinweg wiederverwendet. Kontextvariablen, die via `SET app.*` gesetzt werden, müssen pro Checkout und Transaktionsabschluss zuverlässig gesetzt und bereinigt werden.

## Entscheidung
Wir etablieren ein **hybrides Defense-in-Depth-Isolationsmodell**:

### 1. Isolation auf Datenbankebene (Enterprise B2B-Perimeter)
- Erzwungene PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`) bleibt der unveränderliche äußere Schutzperimeter für alle persistenten Entitäten (`contracts`, `chunks`, `analysis_tasks`, `legal_actions`, `users`).
- Die Mandantengrenze wird pro Connection-Checkout über `TenantAwareDataSource` basierend auf dem ThreadLocal-`TenantContext` injiziert.
- Keine Datenbankabfrage kann die aktive Mandantengrenze ohne einen expliziten, auditierten administrativen Bypass (`app.bypass_rls = 'true'`) überschreiten.

### 2. Eigentumsprüfung auf Applikationsebene (Granularer B2C-Schutz)
- Innerhalb des geteilten B2C-Standardmandanten wird der Zugriff auf Objektebene strikt auf Service- und Controller-Ebene durchgesetzt (`verifyContractOwner` / `@PreAuthorize`).
- Controller, die Verträge, rechtliche Aktionen oder Exporte verarbeiten, erzwingen explizit:
  ```java
  if (!contract.getUser().getId().equals(userDetails.getUserId())) {
      throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
  }
  ```
- Dadurch ergänzen sich die Datenbank-RLS und die applikationsseitigen Zugriffskontrollen als komplementäre Sicherheitsschichten (Defense-in-Depth).

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
- Interne Webhooks (z. B. vom FastAPI AI-Gateway) authentifizieren sich über ein Pre-Shared Secret (`X-Internal-Secret`) und stellen den Mandantenkontext anhand der verifizierten Task-Entität wieder her, bevor benutzerbezogene Daten aktualisiert werden.

## Konsequenzen

### Positiv
- **Garantierte B2B-Isolation**: Unternehmenskunden haben die mathematische Gewissheit, dass Datenabfragen die Mandantengrenze auf DB-Ebene nicht überschreiten können.
- **Robuster B2C-Schutz gegen IDOR**: Insecure Direct Object References (IDOR) werden an allen Endpunkten für Endverbraucher systematisch unterbunden.
- **Auditierbarer Lebenszyklus**: Sämtliche RLS-Bypass-Operationen sind zentral gekapselt und durch strikte `try-finally`-Blöcke abgesichert, was ThreadLocal-Leaks verhindert.
- **Operative Zuverlässigkeit**: Hintergrund-Outbox-Worker und asynchrone Pipelines arbeiten deterministisch und blockieren nicht an unvollständigen Session-Kontexten.

### Abwägungen & Gegenmaßnahmen (Trade-offs)
- **Doppelte Prüfpflicht**: Entwickler müssen bei neuen Controllern stets `verifyContractOwner` implementieren. Controller-Integrationstests prüfen explizit, dass Anfragen fremder Benutzer innerhalb desselben B2C-Mandanten mit HTTP 403 Forbidden abgewiesen werden.
