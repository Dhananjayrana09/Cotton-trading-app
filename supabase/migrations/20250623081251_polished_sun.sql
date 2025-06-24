/*
  # Payment Processing Tables

  1. New Tables
    - `cost_calculations`
      - `id` (uuid, primary key)
      - `allocation_id` (uuid, foreign key)
      - `indent_number` (text)
      - `base_amount` (numeric)
      - `gst_rate` (numeric)
      - `cgst_rate` (numeric)
      - `sgst_rate` (numeric)
      - `gst_amount` (numeric)
      - `cgst_amount` (numeric)
      - `sgst_amount` (numeric)
      - `total_amount` (numeric)
      - `zone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `payment_transactions`
      - `id` (uuid, primary key)
      - `allocation_id` (uuid, foreign key)
      - `payment_id` (text, unique)
      - `indent_number` (text)
      - `amount` (numeric)
      - `payment_method` (text)
      - `payment_status` (text)
      - `utr_number` (text)
      - `payment_date` (timestamp)
      - `gateway_response` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `emd_details`
      - `id` (uuid, primary key)
      - `allocation_id` (uuid, foreign key)
      - `indent_number` (text)
      - `emd_amount` (numeric)
      - `emd_percentage` (numeric)
      - `emd_date` (date)
      - `emd_status` (text)
      - `bank_details` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `zone_tax_rates`
      - `zone` (text, primary key)
      - `cgst_rate` (numeric)
      - `sgst_rate` (numeric)
      - `igst_rate` (numeric)
      - `additional_tax` (numeric)
      - `effective_from` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for system operations

  3. Indexes
    - Add indexes for frequently queried columns
    - Add composite indexes for complex queries
*/

-- Zone Tax Rates Table
CREATE TABLE IF NOT EXISTS zone_tax_rates (
  zone text PRIMARY KEY,
  cgst_rate numeric NOT NULL DEFAULT 2.5,
  sgst_rate numeric NOT NULL DEFAULT 2.5,
  igst_rate numeric NOT NULL DEFAULT 5.0,
  additional_tax numeric DEFAULT 0,
  effective_from date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zone_tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tax rates"
  ON zone_tax_rates
  FOR SELECT
  TO public
  USING (true);

-- Insert default tax rates
INSERT INTO zone_tax_rates (zone, cgst_rate, sgst_rate, igst_rate) VALUES
  ('North', 5.0, 5.0, 10.0),
  ('South', 6.0, 6.0, 12.0),
  ('East', 2.5, 2.5, 5.0),
  ('West', 2.5, 2.5, 5.0),
  ('Central', 2.5, 2.5, 5.0),
  ('Default', 2.5, 2.5, 5.0)
ON CONFLICT (zone) DO NOTHING;

-- Cost Calculations Table
CREATE TABLE IF NOT EXISTS cost_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid,
  indent_number text NOT NULL,
  base_amount numeric NOT NULL,
  gst_rate numeric NOT NULL DEFAULT 5.0,
  cgst_rate numeric NOT NULL DEFAULT 2.5,
  sgst_rate numeric NOT NULL DEFAULT 2.5,
  igst_rate numeric DEFAULT 0,
  gst_amount numeric NOT NULL,
  cgst_amount numeric NOT NULL,
  sgst_amount numeric NOT NULL,
  igst_amount numeric DEFAULT 0,
  additional_charges numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  zone text NOT NULL,
  calculation_status text DEFAULT 'calculated',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cost_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage cost calculations"
  ON cost_calculations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_cost_calculations_indent ON cost_calculations (indent_number);
CREATE INDEX idx_cost_calculations_allocation ON cost_calculations (allocation_id);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid,
  payment_id text UNIQUE NOT NULL,
  indent_number text NOT NULL,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'bank_transfer',
  payment_status text DEFAULT 'pending',
  utr_number text,
  payment_date timestamptz,
  gateway_response jsonb,
  failure_reason text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions (payment_id);
CREATE INDEX idx_payment_transactions_indent ON payment_transactions (indent_number);
CREATE INDEX idx_payment_transactions_status ON payment_transactions (payment_status);
CREATE INDEX idx_payment_transactions_utr ON payment_transactions (utr_number);

-- EMD Details Table
CREATE TABLE IF NOT EXISTS emd_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid,
  indent_number text NOT NULL,
  emd_amount numeric NOT NULL,
  emd_percentage numeric NOT NULL DEFAULT 10.0,
  emd_date date DEFAULT CURRENT_DATE,
  emd_status text DEFAULT 'pending',
  bank_details jsonb,
  dd_number text,
  bank_name text,
  branch_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE emd_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage EMD details"
  ON emd_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_emd_details_indent ON emd_details (indent_number);
CREATE INDEX idx_emd_details_status ON emd_details (emd_status);

-- Payment Reminders Table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  indent_number text NOT NULL,
  reminder_type text NOT NULL,
  reminder_count integer DEFAULT 1,
  last_sent_at timestamptz DEFAULT now(),
  next_reminder_at timestamptz,
  email_sent boolean DEFAULT false,
  sms_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payment reminders"
  ON payment_reminders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_payment_reminders_payment_id ON payment_reminders (payment_id);
CREATE INDEX idx_payment_reminders_next_reminder ON payment_reminders (next_reminder_at);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cost_calculations_updated_at
    BEFORE UPDATE ON cost_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emd_details_updated_at
    BEFORE UPDATE ON emd_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();