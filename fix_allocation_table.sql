-- Add missing columns to existing allocation_table for email processing
-- This script adds columns needed for the automated email processing module

-- Add parsing confidence column
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS parsing_confidence DECIMAL(5,2);

-- Add PDF filename column
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255);

-- Add PDF URL column
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add created_by column if not exists
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'system';

-- Add date_of_allocation column if not exists (for email processing)
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS date_of_allocation DATE;

-- Add cotton_fibre_specification column if not exists
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS cotton_fibre_specification TEXT;

-- Add ccl_discount column if not exists
ALTER TABLE allocation_table 
ADD COLUMN IF NOT EXISTS ccl_discount DECIMAL(5,2) DEFAULT 0.00;

-- Add comments for new columns
COMMENT ON COLUMN allocation_table.parsing_confidence IS 'Confidence score of PDF parsing (0-100)';
COMMENT ON COLUMN allocation_table.pdf_filename IS 'Name of the PDF file from email attachment';
COMMENT ON COLUMN allocation_table.pdf_url IS 'URL to the stored PDF file in Supabase storage';
COMMENT ON COLUMN allocation_table.created_by IS 'User or system that created the record';
COMMENT ON COLUMN allocation_table.date_of_allocation IS 'Date when allocation was made';
COMMENT ON COLUMN allocation_table.cotton_fibre_specification IS 'Detailed cotton fibre specifications';
COMMENT ON COLUMN allocation_table.ccl_discount IS 'CCL discount percentage'; 