# GitHub Copilot System Instructions for B2C Contract Checker (Java Spring)

This file contains custom instructions for GitHub Copilot when working with the B2C Contract Checker Java Spring project. It outlines the codebase's architecture, patterns, technologies, and constraints.

---

## 1. Project Overview & Scope
- **Directory**: `01_b2c-contractchecker-java-spring`
- **Application Type**: Spring Boot 3 B2C Web Application (Thymeleaf MVC + Spring Security 6)
- **Key Feature**: Automated contract analysis and chatbot engine with forced PostgreSQL Row-Level Security (RLS) and multi-tenancy.

---

## 2. Technology Stack & Configuration
- **Java Version**: 21 (uses modern Java features such as records, pattern matching, switch expressions, and virtual threads if enabled)
- **Framework**: Spring Boot `3.3.1` (Spring Security 6, Spring Data JPA)
- **Database**: PostgreSQL (Production/Dev), H2 (Testing/In-Memory)
- **Migrations**: Flyway (`src/main/resources/db/migration/`)
- **Utilities**: Lombok (annotations like `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`)
- **Template Engine**: Thymeleaf with `thymeleaf-extras-springsecurity6`

---

## 3. Core Architecture: Multi-Tenancy & Row-Level Security (RLS)
The database enforces strict tenant isolation using Postgres Row-Level Security (RLS). Every table containing tenant-scoped data must have RLS enabled and forced.

### 3.1 Context Propagation
- **`TenantContext`**: Stores the current tenant's ID (`currentTenant`) and the current user's ID (`currentUser`) inside JVM `ThreadLocal` variables.
- **`TenantAwareDataSource`**: Intercepts JDBC connections to inject current session variables:
  ```sql
  SET app.current_tenant_id = '<tenant_uuid>';
  SET app.current_user_id = '<user_uuid>';
  ```
- **Constraint**: Before any database operation, `TenantContext` must be populated. Failure to set `TenantContext` means queries targeting RLS-protected tables will return empty results or throw security violations.

### 3.2 Guidelines for Copilot when writing Database-related Java code:
- **Context Handling**:
  - Always verify that the tenant/user context is set when spawning asynchronous tasks, background jobs, or parallel streams. Since `TenantContext` is a `ThreadLocal`, background threads do NOT automatically inherit context unless explicitly copied.
  - When initiating background analysis, copy the context:
    ```java
    UUID tenantId = TenantContext.getCurrentTenant();
    UUID userId = TenantContext.getCurrentUser();
    // In background thread:
    try {
        TenantContext.setCurrentTenant(tenantId);
        TenantContext.setCurrentUser(userId);
        // perform work...
    } finally {
        TenantContext.clear();
    }
    ```
- **Login Bypass**: During authentication/login via `CustomUserDetailsService`, the `TenantContext` is intentionally cleared temporarily because the tenant is not yet authenticated, allowing the application to lookup users across all tenants.

---

## 4. Entity & JPA Guidelines
All persistent models under `de.ihrezuhauseberatung.contractchecker.models` follow strict criteria:

- **Primary Keys**: Always use `UUID` for keys, and use `@PrePersist` to automatically generate `UUID.randomUUID()` and timestamps (`createdAt`, `updatedAt`) if not set:
  ```java
  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;
  ```
- **Tenant Scope**: Tenant-scoped entities must include an association to the `Tenant` entity:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tenant_id", nullable = false)
  private Tenant tenant;
  ```
- **Lombok Usage with JPA**:
  - While `@Data` is used, be highly cautious of `@EqualsAndHashCode` and `@ToString` on lazy-loaded relationships (`@ManyToOne`, `@OneToMany`) to avoid circular references or unnecessary database queries.
  - Exclude relationships or prefer using `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder`.
- **JSON Mapping**: Maps and JSON structures are mapped to PostgreSQL `jsonb` columns using Hibernate 6 annotations:
  ```java
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "summary", columnDefinition = "jsonb")
  private Map<String, Object> summary;
  ```

---

## 5. Web, Controller, & Security Guidelines
- **MVC Architecture**: The application uses Thymeleaf MVC controllers. Use `@Controller` instead of `@RestController`.
- **Thymeleaf Interaction**: Return view names as strings (e.g. `"redirect:/dashboard"`, `"dashboard"`). Use the `Model` object to pass attributes to Thymeleaf templates.
- **Authentication Principal**: Access authenticated user details via `@AuthenticationPrincipal CustomUserDetails userDetails` in controller methods:
  ```java
  @PostMapping("/contract/upload")
  public String uploadContract(
          @RequestParam("file") MultipartFile file,
          @AuthenticationPrincipal CustomUserDetails userDetails,
          Model model) {
      UUID userId = userDetails.getUserId();
      UUID tenantId = userDetails.getTenantId();
      // ...
  }
  ```

---

## 6. Flyway & Database Schema Guidelines
All Flyway migration scripts under `src/main/resources/db/migration/` must respect Postgres RLS.
- **Flyway Version Naming**: Naming format is `V<Version>__<Description>.sql` (double underscore).
- **Enabling RLS**: Every new tenant-scoped table must explicitly enable and force Row-Level Security and have a policy defined:
  ```sql
  ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
  ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;

  CREATE POLICY tenant_isolation_<table_name> ON <table_name>
      FOR ALL
      USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  ```

---

## 7. Quality, Tests, & Performance Guidelines
- **Unit & Integration Tests**:
  - Tests are placed under `src/test/java/`.
  - Use `com.h2database:h2` as the in-memory test database.
  - Use `@SpringBootTest` and `@ActiveProfiles("test")` where appropriate.
  - Mock external services (e.g., AI and file storage) to keep tests fast and deterministic.
- **Loom/Virtual Threads Compatibility**: Avoid pinning carrier threads by minimizing synchronization blocks; use `ReentrantLock` if mutual exclusion is necessary.
- **Exception Handling**: Use localized error messages and handle standard entity resolution exceptions cleanly. Ensure Thymeleaf models receive meaningful error attributes in case of failures.
