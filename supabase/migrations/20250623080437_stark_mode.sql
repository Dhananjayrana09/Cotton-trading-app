/*
  # Cotton Trading Automation Database Schema

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `email_subject` (text)
      - `sender_email` (text)
      - `received_at` (timestamptz)
      - `has_pdf` (boolean)
      - `pdf_filename` (text, nullable)
      - `pdf_s3_url` (text, nullable)
      - `processing_status` (text with enum constraint)
      - `parsing_confidence` (numeric, nullable)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)

    - `cotton_trade_data`
      - `id` (uuid, primary key)
      - `indent_number` (text)
      - `buyer_type` (text)
      - `buyer_name` (text)
      - `center_name` (text)
      - `branch` (text)
      - `date_of_allocation` (text)
      - `firm_name` (text)
      - `variety` (text)
      - `bales_quantity` (integer)
      - `crop_year` (text)
      - `offer_price` (numeric)
      - `bid_price` (numeric)
      - `lifting_period` (text)
      - `fibre_length` (text)
      - `cotton_fibre_specification` (text)
      - `ccl_discount` (numeric)
      - `created_by` (text)
      - `parsing_confidence` (numeric)
      - `status` (text with enum constraint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `processing_logs`
      - `id` (uuid, primary key)
      - `email_log_id` (uuid, foreign key)
      - `processing_stage` (text)
      - `status` (text with enum constraint)
      - `message` (text)
      - `details` (jsonb, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for service role to perform system operations

  3. Indexes
    - Add indexes for frequently queried columns
    - Add indexes for foreign key relationships
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_subject text NOT NULL,
  sender_email text NOT NULL,
  received_at timestamptz NOT NULL,
  has_pdf boolean NOT NULL DEFAULT false,
  pdf_filename text,
  pdf_s3_url text,
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'failed', 'pending_review')),
  parsing_confidence numeric CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create cotton_trade_data table
CREATE TABLE IF NOT EXISTS cotton_trade_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text NOT NULL,
  buyer_type text NOT NULL,
  buyer_name text NOT NULL,
  center_name text NOT NULL,
  branch text NOT NULL,
  date_of_allocation text NOT NULL,
  firm_name text NOT NULL,
  variety text NOT NULL,
  bales_quantity integer NOT NULL CHECK (bales_quantity > 0),
  crop_year text NOT NULL,
  offer_price numeric NOT NULL CHECK (offer_price > 0),
  bid_price numeric NOT NULL CHECK (bid_price > 0),
  lifting_period text NOT NULL,
  fibre_length text NOT NULL,
  cotton_fibre_specification text NOT NULL,
  ccl_discount numeric NOT NULL DEFAULT 0,
  created_by text NOT NULL DEFAULT 'system',
  parsing_confidence numeric NOT NULL CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create processing_logs table
CREATE TABLE IF NOT EXISTS processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id uuid NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  processing_stage text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_received_at ON email_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_processing_status ON email_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sender_email ON email_logs(sender_email);

CREATE INDEX IF NOT EXISTS idx_cotton_trade_data_created_at ON cotton_trade_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotton_trade_data_status ON cotton_trade_data(status);
CREATE INDEX IF NOT EXISTS idx_cotton_trade_data_buyer_name ON cotton_trade_data(buyer_name);
CREATE INDEX IF NOT EXISTS idx_cotton_trade_data_indent_number ON cotton_trade_data(indent_number);
CREATE INDEX IF NOT EXISTS idx_cotton_trade_data_firm_name ON cotton_trade_data(firm_name);

CREATE INDEX IF NOT EXISTS idx_processing_logs_email_log_id ON processing_logs(email_log_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotton_trade_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update email logs"
  ON email_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read cotton trade data"
  ON cotton_trade_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert cotton trade data"
  ON cotton_trade_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cotton trade data"
  ON cotton_trade_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read processing logs"
  ON processing_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert processing logs"
  ON processing_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for service role (for system operations)
CREATE POLICY "Service role can manage email logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage cotton trade data"
  ON cotton_trade_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage processing logs"
  ON processing_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for cotton_trade_data
CREATE TRIGGER update_cotton_trade_data_updated_at
  BEFORE UPDATE ON cotton_trade_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();