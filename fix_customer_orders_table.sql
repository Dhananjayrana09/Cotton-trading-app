-- Fix Customer Orders Table - Add missing allocation_id column
-- Run this script in your Supabase SQL editor or PostgreSQL client

-- First, check if the customer_orders table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_orders'
    ) THEN
        -- Create the customer_orders table if it doesn't exist
        CREATE TABLE customer_orders (
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
        
        RAISE NOTICE 'Created customer_orders table';
    ELSE
        -- Table exists, check if allocation_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'customer_orders' 
            AND column_name = 'allocation_id'
        ) THEN
            -- Add the missing allocation_id column
            ALTER TABLE customer_orders 
            ADD COLUMN allocation_id UUID REFERENCES allocation_table(id);
            
            RAISE NOTICE 'Added allocation_id column to customer_orders table';
        ELSE
            RAISE NOTICE 'allocation_id column already exists in customer_orders table';
        END IF;
    END IF;
END $$;

-- Create order_audit_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_audit_logs'
    ) THEN
        CREATE TABLE order_audit_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            order_id UUID REFERENCES customer_orders(id),
            indent_number VARCHAR(255) NOT NULL,
            action VARCHAR(255) NOT NULL,
            details JSONB,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created order_audit_logs table';
    ELSE
        RAISE NOTICE 'order_audit_logs table already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_orders_indent_number ON customer_orders(indent_number);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON customer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_orders_allocation_id ON customer_orders(allocation_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_id ON order_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_timestamp ON order_audit_logs(timestamp);

-- Verify the tables and columns
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('customer_orders', 'order_audit_logs')
ORDER BY table_name, ordinal_position; 