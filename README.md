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