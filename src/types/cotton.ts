export interface CottonTradeData {
  id?: string;
  indent_number: string;
  buyer_type: string;
  buyer_name: string;
  center_name: string;
  branch: string;
  date_of_allocation: string;
  firm_name: string;
  variety: string;
  bales_quantity: number;
  crop_year: string;
  offer_price: number;
  bid_price: number;
  lifting_period: string;
  fibre_length: string;
  cotton_fibre_specification: string;
  ccl_discount: number;
  created_by: string;
  parsing_confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  created_at?: string;
  updated_at?: string;
}

export interface EmailLog {
  id?: string;
  email_subject: string;
  sender_email: string;
  received_at: string;
  has_pdf: boolean;
  pdf_filename?: string;
  pdf_s3_url?: string;
  processing_status: 'received' | 'processed' | 'failed' | 'pending_review';
  parsing_confidence?: number;
  error_message?: string;
  created_at?: string;
}

export interface ProcessingLog {
  id?: string;
  email_log_id: string;
  processing_stage: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  created_at?: string;
}

export interface ParsingStats {
  total_emails: number;
  successful_parsing: number;
  failed_parsing: number;
  pending_review: number;
  average_confidence: number;
}