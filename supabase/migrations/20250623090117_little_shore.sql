/*
  # Contract Management Tables

  1. New Tables
    - `procurement_table`
      - Stores procurement/indent details for contract management
    - `purchase_contract_table`
      - Stores uploaded purchase contract information
    - `branch_information`
      - Stores branch contact details and email addresses
    - `contract_audit_logs`
      - Maintains audit trail for all contract-related actions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and service role

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Procurement Table (for storing indent/procurement details)
CREATE TABLE IF NOT EXISTS procurement_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text UNIQUE NOT NULL,
  buyer_type text NOT NULL,
  buyer_name text NOT NULL,
  firm_name text NOT NULL,
  center_name text NOT NULL,
  branch text NOT NULL,
  variety text NOT NULL,
  bales_quantity integer NOT NULL CHECK (bales_quantity > 0),
  offer_price numeric NOT NULL CHECK (offer_price > 0),
  bid_price numeric NOT NULL CHECK (bid_price > 0),
  crop_year text NOT NULL,
  lifting_period text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Contract Table
CREATE TABLE IF NOT EXISTS purchase_contract_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text NOT NULL,
  firm_name text NOT NULL,
  contract_filename text NOT NULL,
  contract_s3_url text NOT NULL,
  upload_status text DEFAULT 'pending_approval' CHECK (upload_status IN ('uploaded', 'pending_approval', 'approved', 'rejected')),
  uploaded_by text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Branch Information Table
CREATE TABLE IF NOT EXISTS branch_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name text UNIQUE NOT NULL,
  branch_email_id text NOT NULL,
  branch_code text,
  region text,
  contact_person text,
  phone_number text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contract Audit Logs Table
CREATE TABLE IF NOT EXISTS contract_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text NOT NULL,
  action text NOT NULL,
  performed_by text NOT NULL,
  details jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE procurement_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_contract_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read procurement data"
  ON procurement_table
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage purchase contracts"
  ON purchase_contract_table
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read branch information"
  ON branch_information
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read audit logs"
  ON contract_audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create audit logs"
  ON contract_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for service role
CREATE POLICY "Service role can manage procurement data"
  ON procurement_table
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage contracts"
  ON purchase_contract_table
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage branch information"
  ON branch_information
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage audit logs"
  ON contract_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for public
CREATE POLICY "Public can read procurement data"
  ON procurement_table
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX idx_procurement_indent_number ON procurement_table (indent_number);
CREATE INDEX idx_procurement_branch ON procurement_table (branch);
CREATE INDEX idx_procurement_status ON procurement_table (status);

CREATE INDEX idx_contract_indent_number ON purchase_contract_table (indent_number);
CREATE INDEX idx_contract_upload_status ON purchase_contract_table (upload_status);
CREATE INDEX idx_contract_uploaded_at ON purchase_contract_table (uploaded_at DESC);

CREATE INDEX idx_branch_name ON branch_information (branch_name);
CREATE INDEX idx_branch_email ON branch_information (branch_email_id);

CREATE INDEX idx_audit_indent_number ON contract_audit_logs (indent_number);
CREATE INDEX idx_audit_timestamp ON contract_audit_logs (timestamp DESC);

-- Create triggers for updated_at columns
CREATE TRIGGER update_procurement_table_updated_at
    BEFORE UPDATE ON procurement_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_contract_table_updated_at
    BEFORE UPDATE ON purchase_contract_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_information_updated_at
    BEFORE UPDATE ON branch_information
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO procurement_table (
  indent_number, buyer_type, buyer_name, firm_name, center_name, branch,
  variety, bales_quantity, offer_price, bid_price, crop_year, lifting_period
) VALUES
  ('IND2024001', 'Mill', 'Gujarat Cotton Mills Ltd', 'Riddhi Siddhi Traders', 'Ahmedabad', 'Gujarat Branch', 'Shankar-6', 150, 6500, 6450, '2023-24', '30 days'),
  ('IND2024002', 'Trader', 'Maharashtra Cotton Traders', 'Sai Cotton Enterprises', 'Nagpur', 'Maharashtra Branch', 'Bt Cotton', 200, 6300, 6250, '2023-24', '45 days'),
  ('IND2024003', 'Mill', 'Rajasthan Textiles', 'Ganesh Cotton Co', 'Jodhpur', 'Rajasthan Branch', 'Desi Cotton', 100, 5800, 5750, '2023-24', '30 days')
ON CONFLICT (indent_number) DO NOTHING;

INSERT INTO branch_information (
  branch_name, branch_email_id, branch_code, region, contact_person, phone_number
) VALUES
  ('Gujarat Branch', 'gujarat@cci.gov.in', 'GUJ001', 'West', 'Ramesh Patel', '+91-79-12345678'),
  ('Maharashtra Branch', 'maharashtra@cci.gov.in', 'MAH001', 'West', 'Suresh Kumar', '+91-22-87654321'),
  ('Rajasthan Branch', 'rajasthan@cci.gov.in', 'RAJ001', 'North', 'Vikram Singh', '+91-291-11223344'),
  ('Tamil Nadu Branch', 'tamilnadu@cci.gov.in', 'TN001', 'South', 'Murugan Raj', '+91-44-99887766'),
  ('Karnataka Branch', 'karnataka@cci.gov.in', 'KAR001', 'South', 'Ravi Sharma', '+91-80-55443322')
ON CONFLICT (branch_name) DO NOTHING;