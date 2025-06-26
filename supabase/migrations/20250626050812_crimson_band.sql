/*
  # Sales Confirmation Tables

  1. New Tables
    - `sales_table`
      - Stores sales order information with customer and broker details
    - `broker_jobs`
      - Stores broker information and commission details
    - `customer_jobs`
      - Stores customer job/order information
    - `lot_allocations`
      - Tracks lot allocations and blocking status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admin access

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Sales Table
CREATE TABLE IF NOT EXISTS sales_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text NOT NULL,
  buyer_type text NOT NULL,
  bales_quantity integer NOT NULL CHECK (bales_quantity > 0),
  center_name text NOT NULL,
  branch text NOT NULL,
  date date NOT NULL,
  lifting_period integer NOT NULL,
  fibre_length numeric NOT NULL,
  variety text NOT NULL,
  bid_price numeric NOT NULL CHECK (bid_price > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'admin_review', 'completed', 'cancelled')),
  customer_contact jsonb,
  broker_contact jsonb,
  broker_commission numeric DEFAULT 0,
  total_amount numeric,
  draft_contract_url text,
  final_contract_url text,
  allocated_lots jsonb,
  admin_notes text,
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Broker Jobs Table
CREATE TABLE IF NOT EXISTS broker_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id text NOT NULL,
  broker_name text NOT NULL,
  broker_email text NOT NULL,
  broker_phone text,
  commission_rate numeric NOT NULL DEFAULT 2.5,
  commission_type text DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  region text,
  specialization text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_sales numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Jobs Table
CREATE TABLE IF NOT EXISTS customer_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  company_name text,
  customer_type text NOT NULL CHECK (customer_type IN ('Mill', 'Trader', 'Exporter')),
  credit_limit numeric DEFAULT 0,
  outstanding_amount numeric DEFAULT 0,
  region text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_orders numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lot Allocations Table
CREATE TABLE IF NOT EXISTS lot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id uuid REFERENCES sales_table(id) ON DELETE CASCADE,
  lot_number text NOT NULL,
  indent_number text NOT NULL,
  allocated_quantity integer NOT NULL,
  status text DEFAULT 'allocated' CHECK (status IN ('allocated', 'blocked', 'released', 'delivered')),
  allocation_date timestamptz DEFAULT now(),
  blocked_until timestamptz,
  notes text
);

-- Enable Row Level Security
ALTER TABLE sales_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can manage sales data"
  ON sales_table
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read broker data"
  ON broker_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read customer data"
  ON customer_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage lot allocations"
  ON lot_allocations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for service role
CREATE POLICY "Service role can manage all sales data"
  ON sales_table
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage broker data"
  ON broker_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage customer data"
  ON customer_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_sales_table_indent_number ON sales_table (indent_number);
CREATE INDEX idx_sales_table_status ON sales_table (status);
CREATE INDEX idx_sales_table_created_at ON sales_table (created_at DESC);
CREATE INDEX idx_sales_table_buyer_type ON sales_table (buyer_type);

CREATE INDEX idx_broker_jobs_broker_id ON broker_jobs (broker_id);
CREATE INDEX idx_broker_jobs_status ON broker_jobs (status);
CREATE INDEX idx_broker_jobs_region ON broker_jobs (region);

CREATE INDEX idx_customer_jobs_customer_id ON customer_jobs (customer_id);
CREATE INDEX idx_customer_jobs_status ON customer_jobs (status);
CREATE INDEX idx_customer_jobs_customer_type ON customer_jobs (customer_type);

CREATE INDEX idx_lot_allocations_sales_id ON lot_allocations (sales_id);
CREATE INDEX idx_lot_allocations_lot_number ON lot_allocations (lot_number);
CREATE INDEX idx_lot_allocations_status ON lot_allocations (status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_sales_table_updated_at
    BEFORE UPDATE ON sales_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broker_jobs_updated_at
    BEFORE UPDATE ON broker_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_jobs_updated_at
    BEFORE UPDATE ON customer_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO broker_jobs (
  broker_id, broker_name, broker_email, broker_phone, commission_rate, region, specialization
) VALUES
  ('BRK001', 'Rajesh Cotton Brokers', 'rajesh@cottonbrokers.com', '+91-98765-43210', 2.5, 'Gujarat', 'Premium Cotton'),
  ('BRK002', 'Suresh Trading Co', 'suresh@tradingco.com', '+91-87654-32109', 3.0, 'Maharashtra', 'Bulk Trading'),
  ('BRK003', 'Mahesh Exports', 'mahesh@exports.com', '+91-76543-21098', 2.0, 'Tamil Nadu', 'Export Quality')
ON CONFLICT DO NOTHING;

INSERT INTO customer_jobs (
  customer_id, customer_name, customer_email, customer_phone, company_name, customer_type, credit_limit, region
) VALUES
  ('CUST001', 'Amit Patel', 'amit@gujaratmills.com', '+91-99887-76655', 'Gujarat Cotton Mills', 'Mill', 5000000, 'Gujarat'),
  ('CUST002', 'Priya Sharma', 'priya@maharashtratraders.com', '+91-88776-65544', 'Maharashtra Traders', 'Trader', 3000000, 'Maharashtra'),
  ('CUST003', 'Ravi Kumar', 'ravi@southexports.com', '+91-77665-54433', 'South Exports Ltd', 'Exporter', 8000000, 'Tamil Nadu')
ON CONFLICT DO NOTHING;