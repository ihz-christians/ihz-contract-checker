# ADR 001: Multi-Tenancy Architecture, PostgreSQL Row-Level Security (RLS), and Defense-in-Depth

## Status
Accepted

## Context
The platform supports both B2B organizational clients (business tenants requiring strict contractual and regulatory data segregation) and B2C individual consumers (self-registered end users analyzing personal utility and telecommunication contracts).

A critical architectural requirement is guaranteeing zero cross-tenant data contamination while maintaining high developer velocity, testability, and operational simplicity.

Initially, PostgreSQL Row-Level Security (RLS) with session-level GUC variables (`app.current_tenant_id`) was introduced to enforce isolation directly at the database engine level. However, a pure database RLS policy keyed exclusively on `tenant_id` introduces specific challenges in a hybrid B2B/B2C architecture:
1. **Shared B2C Tenant**: All self-registered B2C consumers are grouped under a default B2C tenant (`11111111-1111-1111-1111-111111111111`) to prevent per-consumer tenant proliferation. If database RLS is solely tenant-scoped, it prevents cross-tenant access, but does not isolate individual B2C consumers within the same tenant.
2. **Background Outbox Processing**: Background workers (such as `@Scheduled` outbox dispatchers) operate outside HTTP request threads and have no initial tenant context. Unchecked RLS policies would suppress all pending outbox records from worker queries.
3. **Connection Pooling Interaction**: In high-throughput Spring/HikariCP architectures, connections are reused across transactions. Context variables set via `SET app.*` must be reliably injected and scrubbed upon request or transaction completion.

## Decision
We adopt a **Hybrid Defense-in-Depth Isolation Model**:

### 1. Database-Level Isolation (Enterprise B2B Boundary)
- Forced PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`) remains the immutable outer perimeter for all persistent entities (`contracts`, `chunks`, `analysis_tasks`, `legal_actions`, `users`).
- The tenant boundary is injected per connection checkout via `TenantAwareDataSource` based on thread-local `TenantContext`.
- No query can traverse beyond the active tenant boundary without explicit, audited administrative bypass (`app.bypass_rls = 'true'`).

### 2. Application-Level Ownership (B2C Fine-Grained Protection)
- Within the shared B2C consumer tenant, fine-grained object ownership is enforced at the controller and service layer (`verifyContractOwner` / `@PreAuthorize`).
- Controllers accessing contracts, legal actions, and exports explicitly assert:
  ```java
  if (!contract.getUser().getId().equals(userDetails.getUserId())) {
      throw new AccessDeniedException("Zugriff verweigert: Vertrag gehört einem anderen Benutzer.");
  }
  ```
- This ensures that database RLS and application-layer access controls operate as complementary layers (Defense-in-Depth).

### 3. Background Outbox Workers & Webhook Processing
- Autonomous system workers (`LegalActionOutboxWorker`) run with an explicit system bypass context:
  ```java
  TenantContext.setBypassRls(true);
  try {
      List<LegalAction> pending = legalActionService.fetchPendingActionsWithLock();
      // process actions...
  } finally {
      TenantContext.clear();
  }
  ```
- Once an outbox record is claimed, the worker explicitly scopes the downstream execution to that record's `tenant_id` and `user_id` before processing legal actions.
- Internal webhooks (e.g., from the AI Gateway) authenticate via a pre-shared header token (`X-Internal-Secret`) and restore tenant context from the verified task entity before mutating user-scoped assets.

## Consequences

### Positive
- **Guaranteed B2B Isolation**: Enterprise clients have mathematical assurance that no query can leak records across tenant boundaries.
- **Robust B2C Security**: Protection against Insecure Direct Object References (IDOR) is systematically enforced for all consumer endpoints.
- **Auditable Lifecycle**: All bypass operations are centralized and strictly bounded inside `try-finally` blocks, preventing thread-local leaks.
- **Operational Reliability**: Background outbox workers and internal asynchronous pipelines operate deterministically without blocking on session context resolution.

### Trade-offs & Mitigations
- **Dual Verification Requirement**: Developers must apply `verifyContractOwner` on any new controller endpoints exposing contract-scoped resources. Controller integration tests specifically assert that requests from different user accounts in the same tenant are rejected with HTTP 403 Forbidden.
