export interface CostCalculation {
  id?: string;
  allocation_id?: string;
  indent_number: string;
  base_amount: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate?: number;
  gst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount?: number;
  additional_charges?: number;
  total_amount: number;
  zone: string;
  is_inter_state?: boolean;
  calculation_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id?: string;
  allocation_id?: string;
  payment_id: string;
  indent_number: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'initiated' | 'completed' | 'failed' | 'cancelled';
  utr_number?: string;
  payment_date?: string;
  gateway_response?: Record<string, any>;
  failure_reason?: string;
  retry_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EMDDetails {
  id?: string;
  allocation_id?: string;
  indent_number: string;
  emd_amount: number;
  emd_percentage: number;
  emd_date: string;
  emd_status: 'pending' | 'received' | 'refunded' | 'forfeited';
  bank_details?: Record<string, any>;
  dd_number?: string;
  bank_name?: string;
  branch_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentReminder {
  id?: string;
  payment_id: string;
  indent_number: string;
  reminder_type: string;
  reminder_count: number;
  last_sent_at?: string;
  next_reminder_at?: string;
  email_sent?: boolean;
  sms_sent?: boolean;
  created_at?: string;
}

export interface ZoneTaxRate {
  zone: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  additional_tax?: number;
  effective_from: string;
  created_at?: string;
}

export interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
}