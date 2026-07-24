CREATE TABLE legal_actions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    contract_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    document_hash VARCHAR(255),
    provider_receipt_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_legal_actions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_legal_actions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_legal_actions_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- RLS (Row Level Security) aktivieren und erzwingen
ALTER TABLE legal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_actions FORCE ROW LEVEL SECURITY;

-- Policy für Tenant Isolation erstellen
CREATE POLICY tenant_isolation_legal_actions ON legal_actions
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
