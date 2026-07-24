-- ==============================================================================
-- Flyway Migration: Support Admin RLS Bypass
-- Drops existing RLS policies and recreates them with app.bypass_rls check
-- ==============================================================================

-- 1. Users table policy recreation
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true' OR
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 2. Contracts table policy recreation
DROP POLICY IF EXISTS tenant_isolation_contracts ON contracts;
CREATE POLICY tenant_isolation_contracts ON contracts
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true' OR
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 3. Chunks table policy recreation
DROP POLICY IF EXISTS tenant_isolation_chunks ON chunks;
CREATE POLICY tenant_isolation_chunks ON chunks
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true' OR
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 4. Analysis Tasks table policy recreation
DROP POLICY IF EXISTS tenant_isolation_analysis_tasks ON analysis_tasks;
CREATE POLICY tenant_isolation_analysis_tasks ON analysis_tasks
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true' OR
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 5. Legal Actions table policy recreation (if exists)
DROP POLICY IF EXISTS tenant_isolation_legal_actions ON legal_actions;
CREATE POLICY tenant_isolation_legal_actions ON legal_actions
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true' OR
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );
