-- Create general audit_logs table for tracking various activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_indent_number ON audit_logs(indent_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'General audit trail for various system activities';
COMMENT ON COLUMN audit_logs.indent_number IS 'Indent number related to the action (optional)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.performed_by IS 'User or system that performed the action';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format'; 