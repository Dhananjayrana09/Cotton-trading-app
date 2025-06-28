-- Customer Orders Table
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    buyer_type VARCHAR(100) NOT NULL,
    bales_quantity INTEGER NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    lifting_period INTEGER NOT NULL,
    fibre_length DECIMAL(5,2) NOT NULL,
    variety VARCHAR(255) NOT NULL,
    bid_price DECIMAL(10,2) NOT NULL,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    allocation_id UUID REFERENCES allocation_table(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Audit Logs Table
CREATE TABLE IF NOT EXISTS order_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES customer_orders(id),
    indent_number VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_orders_indent_number ON customer_orders(indent_number);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_id ON order_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_timestamp ON order_audit_logs(timestamp);

-- Add comments for documentation
COMMENT ON TABLE customer_orders IS 'Stores customer order information after validation';
COMMENT ON TABLE order_audit_logs IS 'Audit trail for customer order actions';

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    company_name VARCHAR(255),
    gst_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brokers Table
CREATE TABLE IF NOT EXISTS brokers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    broker_id UUID REFERENCES brokers(id),
    buyer_type VARCHAR(100) NOT NULL,
    bales_quantity INTEGER NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    lifting_period INTEGER NOT NULL,
    fibre_length DECIMAL(5,2) NOT NULL,
    variety VARCHAR(255) NOT NULL,
    bid_price DECIMAL(10,2) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    allocated_lots TEXT[], -- Array of lot numbers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_number VARCHAR(255) UNIQUE NOT NULL,
    indent_number VARCHAR(255) NOT NULL,
    quantity_bales INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, blocked, sold
    sales_id UUID REFERENCES sales_table(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Contracts Table
CREATE TABLE IF NOT EXISTS sales_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_table(id),
    contract_number VARCHAR(255) UNIQUE NOT NULL,
    pdf_url TEXT,
    status VARCHAR(50) DEFAULT 'generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(name);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON brokers(status);
CREATE INDEX IF NOT EXISTS idx_sales_table_indent_number ON sales_table(indent_number);
CREATE INDEX IF NOT EXISTS idx_sales_table_status ON sales_table(status);
CREATE INDEX IF NOT EXISTS idx_sales_table_customer_id ON sales_table(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_table_broker_id ON sales_table(broker_id);
CREATE INDEX IF NOT EXISTS idx_inventory_table_lot_number ON inventory_table(lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_table_indent_number ON inventory_table(indent_number);
CREATE INDEX IF NOT EXISTS idx_inventory_table_status ON inventory_table(status);
CREATE INDEX IF NOT EXISTS idx_inventory_table_sales_id ON inventory_table(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_sale_id ON sales_contracts(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_contract_number ON sales_contracts(contract_number);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Stores customer information';
COMMENT ON TABLE brokers IS 'Stores broker information';
COMMENT ON TABLE sales_table IS 'Stores sales order information';
COMMENT ON TABLE inventory_table IS 'Stores inventory lot information';
COMMENT ON TABLE sales_contracts IS 'Stores sales contract information';

-- Commission Tracking Table
CREATE TABLE IF NOT EXISTS commission_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_table(id),
    broker_id UUID REFERENCES brokers(id),
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Audit Logs Table
CREATE TABLE IF NOT EXISTS sales_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_table(id),
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(255),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Draft Contracts Table
CREATE TABLE IF NOT EXISTS sales_draft_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_table(id),
    draft_number VARCHAR(255) UNIQUE NOT NULL,
    pdf_url TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, reviewed, approved, final
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Notifications Table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales_table(id),
    email_type VARCHAR(100) NOT NULL, -- blocking_confirmation, contract_sent, etc.
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_commission_tracking_sale_id ON commission_tracking(sale_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_broker_id ON commission_tracking(broker_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_status ON commission_tracking(status);
CREATE INDEX IF NOT EXISTS idx_sales_audit_logs_sale_id ON sales_audit_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_logs_timestamp ON sales_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_draft_contracts_sale_id ON sales_draft_contracts(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_draft_contracts_status ON sales_draft_contracts(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sale_id ON email_notifications(sale_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- Add comments for new tables
COMMENT ON TABLE commission_tracking IS 'Tracks broker commissions for sales';
COMMENT ON TABLE sales_audit_logs IS 'Audit trail for sales actions';
COMMENT ON TABLE sales_draft_contracts IS 'Stores draft sales contracts';
COMMENT ON TABLE email_notifications IS 'Tracks email notifications sent for sales';

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    payment_type VARCHAR(100) NOT NULL, -- cash, bank_transfer, cheque, etc.
    amount DECIMAL(12,2) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    payment_date DATE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Calculations Table
CREATE TABLE IF NOT EXISTS cost_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(10,2) DEFAULT 0.00,
    transport_cost DECIMAL(10,2) DEFAULT 0.00,
    handling_cost DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) NOT NULL,
    calculated_by VARCHAR(255),
    calculation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Details Table (if not exists)
CREATE TABLE IF NOT EXISTS payment_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    payment_type VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment tables
CREATE INDEX IF NOT EXISTS idx_payment_transactions_indent_number ON payment_transactions(indent_number);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_indent_number ON cost_calculations(indent_number);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_calculation_date ON cost_calculations(calculation_date);
CREATE INDEX IF NOT EXISTS idx_payment_details_indent_number ON payment_details(indent_number);
CREATE INDEX IF NOT EXISTS idx_payment_details_status ON payment_details(status);

-- Add comments for payment tables
COMMENT ON TABLE payment_transactions IS 'Stores payment transaction records';
COMMENT ON TABLE cost_calculations IS 'Stores cost calculation records';
COMMENT ON TABLE payment_details IS 'Stores payment detail records';

-- Email Logs Table - Tracks incoming emails and their processing status
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_subject VARCHAR(500) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    has_pdf BOOLEAN DEFAULT FALSE,
    pdf_filename VARCHAR(255),
    pdf_s3_url TEXT,
    processing_status VARCHAR(50) DEFAULT 'received', -- received, processed, pending_review, failed
    parsing_confidence DECIMAL(5,2),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing Logs Table - Detailed audit trail of processing steps
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_log_id UUID REFERENCES email_logs(id),
    processing_stage VARCHAR(100) NOT NULL, -- email_reception, pdf_storage, pdf_parsing, data_extraction
    status VARCHAR(50) NOT NULL, -- success, warning, error
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allocation Logs Table - Tracks actions on allocation records
CREATE TABLE IF NOT EXISTS allocation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indent_number VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_email_logs_sender_email ON email_logs(sender_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_processing_status ON email_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_received_at ON email_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_email_log_id ON processing_logs(email_log_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_processing_stage ON processing_logs(processing_stage);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_allocation_logs_indent_number ON allocation_logs(indent_number);
CREATE INDEX IF NOT EXISTS idx_allocation_logs_created_at ON allocation_logs(created_at);

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks incoming emails and their processing status';
COMMENT ON TABLE processing_logs IS 'Detailed audit trail of email processing steps';
COMMENT ON TABLE allocation_logs IS 'Tracks actions performed on allocation records'; 