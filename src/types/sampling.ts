export interface AllocationData {
  id: string;
  indent_number: string;
  bales_quantity: number;
  center_name: string;
  branch: string;
  date: string;
  lifting_period: number;
  fibre_length: number;
  variety: string;
  bid_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SamplingCalculation {
  base: number;
  extra: number;
  total: number;
}

export interface LotEntry {
  id: string;
  lot_number: string;
  is_valid: boolean;
  error_message?: string;
}

export interface SamplingFormData {
  indent_number: string;
  allocation_data: AllocationData | null;
  calculation: SamplingCalculation | null;
  lot_entries: LotEntry[];
  is_submitted: boolean;
}

export interface InventoryEntry {
  id?: string;
  user_id: string;
  indent_number: string;
  lot_number: string;
  center_name: string;
  branch: string;
  date: string;
  lifting_period: number;
  fibre_length: number;
  variety: string;
  bid_price: number;
  quantity_bales: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SamplingAuditLog {
  id?: string;
  indent_number: string;
  action: string;
  performed_by: string;
  lot_numbers: string[];
  allocation_data: AllocationData;
  calculation_details: SamplingCalculation;
  timestamp?: string;
}