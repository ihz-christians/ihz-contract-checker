-- ==============================================================================
-- Seed default demo consumer user for easy local evaluation and testing
-- ==============================================================================

INSERT INTO users (
    id, 
    tenant_id, 
    email, 
    first_name, 
    last_name, 
    hashed_password, 
    role_id, 
    is_active, 
    is_email_verified,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222', -- fixed user uuid
    '11111111-1111-1111-1111-111111111111', -- Default B2C Tenant
    'kunde@example.com',
    'Max',
    'Mustermann',
    '$2b$12$6PoH5oYT4IRnwseDEdMjNu888.nE3iQeCBXnqSMh/wndvp1.jwcDi', -- verified bcrypt of 'secret'
    'e5b2a048-6fd3-40e1-bb76-2e99d865bfa3', -- ROLE_CONSUMER
    1, -- is_active = true
    1, -- is_email_verified = true
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id, email) DO NOTHING;
