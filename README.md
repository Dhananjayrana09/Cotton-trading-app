# Cotton Trading Automation System

A comprehensive automation system for processing cotton trading emails, extracting PDF data, and managing cotton trade information using n8n workflows, Supabase database, and a modern React frontend.

## Features

### 🔄 Automated Email Processing
- Monitors government email (sgid@icf.gov.in) for "Sale Confirmation of FP Bales" emails
- Automatic PDF detection and extraction from email attachments
- Secure AWS S3 storage with standardized naming conventions
- Real-time processing status tracking

### 🤖 AI-Powered PDF Parsing
- OCR/AI integration for extracting cotton trading data from PDFs
- Confidence scoring for parsing accuracy
- Automatic data validation and cleansing
- Manual review flagging for low-confidence extractions

### 📊 Data Management
- Comprehensive cotton trading data storage in Supabase
- Real-time dashboard with processing statistics
- Advanced filtering and search capabilities
- Export functionality for processed data

### 🎯 Smart Workflow
- n8n-powered automation workflows
- Error handling and retry mechanisms
- Admin notifications for failed processing
- Comprehensive logging and audit trails

## System Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Government    │    │              │    │                 │
│     Email       │───▶│     n8n      │───▶│   AWS S3        │
│  (sgid@icf.gov) │    │   Workflow   │    │  PDF Storage    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   AI/OCR     │    │                 │
                       │  Processing  │───▶│   Supabase      │
                       │              │    │   Database      │
                       └──────────────┘    └─────────────────┘
                                                  │
                                                  ▼
                                           ┌─────────────────┐
                                           │  React Frontend │
                                           │   Dashboard     │
                                           └─────────────────┘
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Automation**: n8n workflows
- **Storage**: AWS S3
- **AI/OCR**: Configurable OCR service integration

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- AWS S3 bucket
- n8n instance
- Email account access (IMAP)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd cotton-trading-automation
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Fill in your configuration values
```

3. **Database Setup**
- Create a new Supabase project
- Run the migration file in `supabase/migrations/`
- Update your `.env` with Supabase credentials

4. **Start the application**
```bash
# Start the development server
npm run dev

# Start the backend server (in another terminal)
npm run server
```

### n8n Workflow Setup

1. Import the workflow from `n8n-workflows/cotton-email-processing.json`
2. Configure your credentials:
   - Email IMAP credentials
   - AWS S3 credentials
   - Backend webhook URLs
3. Set up environment variables in n8n
4. Activate the workflow

## Configuration

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name

# Email
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

# n8n
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_API_KEY=your_n8n_api_key
```

### AI/OCR Integration

The system supports various OCR providers. Configure your preferred service:

- **OpenAI GPT-4 Vision**: For advanced document understanding
- **Google Document AI**: For structured document processing
- **Azure Form Recognizer**: For form-based extractions
- **Custom OCR API**: Implement your own OCR service

## Data Fields Extracted

The system extracts the following fields from cotton trading PDFs:

- **Indent Number**: Unique identifier for the transaction
- **Buyer Type**: Mill, Trader, etc.
- **Buyer Name**: Name of the purchasing entity
- **Center Name**: Trading center location
- **Branch**: Regional branch information
- **Date of Allocation**: When the cotton was allocated
- **Firm Name**: Trading firm name
- **Variety**: Cotton variety (Shankar-6, Bt Cotton, etc.)
- **Bales Quantity**: Number of bales
- **Crop Year**: Agricultural crop year
- **Offer Price**: Seller's offer price
- **Bid Price**: Buyer's bid price
- **Lifting Period**: Time period for collection
- **Fibre Length**: Cotton fiber length measurement
- **Cotton Fibre Specification**: Quality specifications
- **CCL Discount**: Central Cooperative League discount

## API Endpoints

### Webhooks (for n8n integration)
- `POST /api/webhook/email-received` - Email reception notification
- `POST /api/webhook/pdf-parsed` - PDF parsing results

### Data Access
- `GET /api/cotton-data` - Retrieve cotton trading data
- `GET /api/email-logs` - Get email processing logs
- `GET /api/processing-logs` - Get detailed processing logs
- `GET /api/stats` - Get system statistics

## Full API Documentation

### Allocation Workflow

#### `GET /api/allocation`
- **Description:** Retrieve all allocation records.
- **Response:**
```json
[
  {
    "id": 1,
    "contractId": "C-2024-001",
    "allocatedTo": "Mill A",
    "quantity": 100,
    "date": "2024-06-25"
  }
]
```

#### `POST /api/allocation`
- **Description:** Create a new allocation.
- **Request:**
```json
{
  "contractId": "C-2024-001",
  "allocatedTo": "Mill A",
  "quantity": 100,
  "date": "2024-06-25"
}
```
- **Response:**
```json
{
  "success": true,
  "allocation": { /* ... */ }
}
```

---

### Payment Workflow

#### `GET /api/payments`
- **Description:** List all payments.
- **Response:**
```json
[
  {
    "id": 1,
    "orderId": "O-2024-001",
    "amount": 50000,
    "status": "confirmed",
    "date": "2024-06-25"
  }
]
```

#### `POST /api/payments`
- **Description:** Record a new payment.
- **Request:**
```json
{
  "orderId": "O-2024-001",
  "amount": 50000,
  "status": "pending",
  "date": "2024-06-25"
}
```
- **Response:**
```json
{
  "success": true,
  "payment": { /* ... */ }
}
```

---

### Contract Workflow

#### `GET /api/contracts`
- **Description:** List all contracts.
- **Response:**
```json
[
  {
    "id": 1,
    "buyer": "Mill A",
    "variety": "Shankar-6",
    "quantity": 100,
    "status": "approved"
  }
]
```

#### `POST /api/contracts`
- **Description:** Upload a new contract.
- **Request:**
```json
{
  "buyer": "Mill A",
  "variety": "Shankar-6",
  "quantity": 100,
  "status": "pending"
}
```
- **Response:**
```json
{
  "success": true,
  "contract": { /* ... */ }
}
```

#### `PUT /api/contracts/:id/approve`
- **Description:** Approve a contract.
- **Response:**
```json
{
  "success": true,
  "contract": { /* ... */ }
}
```

---

### Sampling/Inventory Workflow

#### `GET /api/sampling`
- **Description:** List all sampling lots.
- **Response:**
```json
[
  {
    "id": 1,
    "lotNumber": "LOT-001",
    "variety": "Shankar-6",
    "quantity": 50,
    "dateSampled": "2024-06-25"
  }
]
```

#### `POST /api/sampling`
- **Description:** Add a new sampling lot.
- **Request:**
```json
{
  "lotNumber": "LOT-001",
  "variety": "Shankar-6",
  "quantity": 50,
  "dateSampled": "2024-06-25"
}
```
- **Response:**
```json
{
  "success": true,
  "sampling": { /* ... */ }
}
```

---

### Customer Order/Payment/Invoice Workflow

#### `GET /api/orders`
- **Description:** List all customer orders.
- **Response:**
```json
[
  {
    "id": 1,
    "customer": "Trader B",
    "variety": "Bt Cotton",
    "quantity": 200,
    "status": "confirmed"
  }
]
```

#### `POST /api/orders`
- **Description:** Create a new customer order.
- **Request:**
```json
{
  "customer": "Trader B",
  "variety": "Bt Cotton",
  "quantity": 200,
  "status": "pending"
}
```
- **Response:**
```json
{
  "success": true,
  "order": { /* ... */ }
}
```

---

### Sales/Contract Generation Workflow

#### `GET /api/sales`
- **Description:** List all sales records.
- **Response:**
```json
[
  {
    "id": 1,
    "orderId": "O-2024-001",
    "amount": 100000,
    "date": "2024-06-25"
  }
]
```

#### `POST /api/sales`
- **Description:** Record a new sale.
- **Request:**
```json
{
  "orderId": "O-2024-001",
  "amount": 100000,
  "date": "2024-06-25"
}
```
- **Response:**
```json
{
  "success": true,
  "sale": { /* ... */ }
}
```

---

### Common Error Response
```json
{
  "success": false,
  "error": "Error message here."
}
```

---

For more details on request/response fields, see the respective router files in `/backend/routes/`.

## Monitoring and Logging

The system provides comprehensive monitoring:

- **Real-time Dashboard**: Processing statistics and trends
- **Email Logs**: Track all incoming emails and their status
- **Processing Logs**: Detailed workflow execution logs
- **Parsing Confidence**: AI confidence scores for data quality
- **Error Tracking**: Failed processing with error details

## Security Features

- Row Level Security (RLS) enabled on all database tables
- API authentication and authorization
- Secure file storage in AWS S3 with encryption
- Input validation and sanitization
- Audit trails for all data modifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the n8n workflow configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Recent Fixes

### Cost Calculation Button Fix (Latest)

The cost calculation button on the payment dashboard has been fixed and enhanced with the following improvements:

1. **Added proper click handler** - The button now opens a comprehensive cost calculation form
2. **Created CostCalculationForm component** - A new modal form for entering calculation details
3. **Added missing backend endpoints**:
   - `/api/payment/zone-tax-rates` - Get all zone tax rates
   - `/api/payment/zone-tax-rates/:zone` - Get tax rate for specific zone
   - `/api/payment/cost-calculations` (POST) - Create new cost calculation
4. **Updated database schema** - Added `zone_tax_rates` table and updated `cost_calculations` table

#### Database Updates Required

Run the following SQL script in your Supabase dashboard to update the database schema:

```sql
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

-- Drop and recreate cost_calculations table with correct schema
DROP TABLE IF EXISTS cost_calculations CASCADE;

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
    additional_charges DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    is_inter_state BOOLEAN DEFAULT FALSE,
    calculation_status VARCHAR(50) DEFAULT 'calculated',
    calculated_by VARCHAR(255),
    calculation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cost_calculations_indent_number ON cost_calculations(indent_number);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_zone ON cost_calculations(zone);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_calculation_date ON cost_calculations(calculation_date);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_status ON cost_calculations(calculation_status);
CREATE INDEX IF NOT EXISTS idx_zone_tax_rates_zone ON zone_tax_rates(zone);
```

#### How to Use

1. **Start the backend server**: `cd backend && npm start`
2. **Start the frontend server**: `cd frontend && npm run dev`
3. **Navigate to Payment Dashboard** in the frontend
4. **Click "Calculate Costs"** button to open the calculation form
5. **Enter allocation details** (indent number, base amount, zone, etc.)
6. **Click "Calculate"** to see the breakdown
7. **Click "Save Calculation"** to store the result

The form now provides:
- Input validation
- Real-time tax rate lookup by zone
- Detailed GST breakdown (CGST, SGST, IGST)
- Support for inter-state transactions
- Professional UI with proper error handling