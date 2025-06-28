-- Fix customer_email constraint issue
-- Run this in your Supabase SQL Editor

-- Make customer_email column nullable
ALTER TABLE customer_orders 
ALTER COLUMN customer_email DROP NOT NULL;

-- Make customer_name column nullable as well (for consistency)
ALTER TABLE customer_orders 
ALTER COLUMN customer_name DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_orders' 
AND column_name IN ('customer_email', 'customer_name'); 