export interface ProcurementDetails {
  id: string;
  indent_number: string;
  buyer_type: string;
  buyer_name: string;
  firm_name: string;
  center_name: string;
  branch: string;
  variety: string;
  bales_quantity: number;
  offer_price: number;
  bid_price: number;
  crop_year: string;
  lifting_period: string;
  status: string;
  created_at: string;
}

export interface PurchaseContract {
  id: string;
  indent_number: string;
  firm_name: string;
  contract_filename: string;
  contract_s3_url: string;
  upload_status: 'uploaded' | 'pending_approval' | 'approved' | 'rejected';
  uploaded_by: string;
  uploaded_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export interface BranchInformation {
  branch_name: string;
  branch_email_id: string;
  branch_code: string;
  region: string;
  contact_person: string;
  phone_number: string;
}

export interface ContractAuditLog {
  id: string;
  indent_number: string;
  action: string;
  performed_by: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface ContractUploadResponse {
  success: boolean;
  contract_id?: string;
  message: string;
  s3_url?: string;
}