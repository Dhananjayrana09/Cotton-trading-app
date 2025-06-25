/*
  # Customer Orders Table

  1. New Tables
    - `customer_orders`
      - Stores customer order information
      - Links to allocation_table via indent_number
      - Tracks order status and payment information

  2. Security
    - Enable RLS on customer_orders table
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Customer Orders Table
CREATE TABLE IF NOT EXISTS customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number text NOT NULL,
  buyer_type text NOT NULL,
  bales_quantity integer NOT NULL CHECK (bales_quantity > 0),
  center_name text NOT NULL,
  branch text NOT NULL,
  order_date date NOT NULL,
  lifting_period integer NOT NULL,
  fibre_length numeric NOT NULL,
  variety text NOT NULL,
  bid_price numeric NOT NULL CHECK (bid_price > 0),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'validated', 'placed', 'confirmed', 'processing', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'failed', 'refunded')),
  payment_amount numeric DEFAULT 0,
  payment_date timestamptz,
  contract_generated boolean DEFAULT false,
  contract_url text,
  notes text,
  created_by text DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can manage customer orders"
  ON customer_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for service role
CREATE POLICY "Service role can manage customer orders"
  ON customer_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_customer_orders_indent_number ON customer_orders (indent_number);
CREATE INDEX idx_customer_orders_status ON customer_orders (order_status);
CREATE INDEX idx_customer_orders_payment_status ON customer_orders (payment_status);
CREATE INDEX idx_customer_orders_created_at ON customer_orders (created_at DESC);
CREATE INDEX idx_customer_orders_buyer_type ON customer_orders (buyer_type);

-- Create trigger for updated_at column
CREATE TRIGGER update_customer_orders_updated_at
    BEFORE UPDATE ON customer_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO customer_orders (
  indent_number, buyer_type, bales_quantity, center_name, branch,
  order_date, lifting_period, fibre_length, variety, bid_price, total_amount
) VALUES
  ('IND2024001', 'Mill', 100, 'Ahmedabad', 'Gujarat Branch', '2024-01-15', 30, 28.5, 'Shankar-6', 6450, 645000),
  ('IND2024002', 'Trader', 150, 'Nagpur', 'Maharashtra Branch', '2024-01-15', 45, 27.8, 'Bt Cotton', 6250, 937500),
  ('IND2024003', 'Mill', 75, 'Jodhpur', 'Rajasthan Branch', '2024-01-16', 30, 29.2, 'Desi Cotton', 5750, 431250)
ON CONFLICT DO NOTHING;