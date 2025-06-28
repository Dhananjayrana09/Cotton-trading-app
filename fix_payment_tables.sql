-- Add Zone Tax Rates Table
CREATE TABLE IF NOT EXISTS zone_tax_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone VARCHAR(100) NOT NULL UNIQUE,
    cgst_rate DECIMAL(5,2) DEFAULT 0.00,
    sgst_rate DECIMAL(5,2) DEFAULT 0.00,
    igst_rate DECIMAL(5,2) DEFAULT 0.00,
    additional_tax DECIMAL(5,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default zone tax rates
INSERT INTO zone_tax_rates (zone, cgst_rate, sgst_rate, igst_rate, additional_tax, description) VALUES
('South', 2.5, 2.5, 5.0, 0.0, 'Southern zone tax rates'),
('North', 1.5, 1.5, 3.0, 0.0, 'Northern zone tax rates'),
('East', 2.0, 2.0, 4.0, 0.0, 'Eastern zone tax rates'),
('West', 2.0, 2.0, 4.0, 0.0, 'Western zone tax rates')
ON CONFLICT (zone) DO NOTHING;

-- Drop the existing cost_calculations table and recreate with correct schema
DROP TABLE IF EXISTS cost_calculations CASCADE;

-- Cost Calculations Table
CREATE TABLE IF NOT EXISTS cost_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    cgst_rate DECIMAL(5,2) DEFAULT 0.00,
    sgst_rate DECIMAL(5,2) DEFAULT 0.00,
    igst_rate DECIMAL(5,2) DEFAULT 0.00,
    cgst_amount DECIMAL(12,2) DEFAULT 0.00,
    sgst_amount DECIMAL(12,2) DEFAULT 0.00,
    igst_amount DECIMAL(12,2) DEFAULT 0.00,
    gst_amount DECIMAL(12,2) DEFAULT 0.00,
    additional_charges DECIMAL(12,2) DEFAULT 0.00, -- ✅ keep only one
    total_amount DECIMAL(12,2) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    is_inter_state BOOLEAN DEFAULT FALSE,
    calculation_status VARCHAR(50) DEFAULT 'calculated',
    calculated_by VARCHAR(255),
    calculation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create indexes for cost_calculations
CREATE INDEX IF NOT EXISTS idx_cost_calculations_indent_number ON cost_calculations(indent_number);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_zone ON cost_calculations(zone);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_calculation_date ON cost_calculations(calculation_date);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_status ON cost_calculations(calculation_status);

-- Create indexes for zone_tax_rates
CREATE INDEX IF NOT EXISTS idx_zone_tax_rates_zone ON zone_tax_rates(zone);

-- Add comments
COMMENT ON TABLE zone_tax_rates IS 'Stores tax rates for different zones';
COMMENT ON TABLE cost_calculations IS 'Stores detailed cost calculation records with GST breakdown'; 