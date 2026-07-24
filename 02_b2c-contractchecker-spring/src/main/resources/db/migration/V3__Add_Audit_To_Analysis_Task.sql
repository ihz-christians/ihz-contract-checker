-- Erweitere die Tabelle analysis_tasks um Compliance- und Audit-Felder
ALTER TABLE analysis_tasks ADD COLUMN audit_trail jsonb;
ALTER TABLE analysis_tasks ADD COLUMN error_message TEXT;
