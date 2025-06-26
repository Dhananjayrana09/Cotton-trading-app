export interface SalesOrder {
  id: string;
  indent_number: string;
  buyer_type: string;
  bales_quantity: number;
  center_name: string;
  branch: string;
  date: string;
  lifting_period: number;
  fibre_length: number;
  variety: string;
  bid_price: number;
  status: 'pending' | 'confirmed' | 'admin_review' | 'completed' | 'cancelled';
  customer_contact?: CustomerJob;
  broker_contact?: BrokerJob;
  broker_commission: number;
  total_amount?: number;
  draft_contract_url?: string;
  final_contract_url?: string;
  allocated_lots?: string[];
  admin_notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableLot {
  id: string;
  lot_number: string;
  indent_number: string;
  center_name: string;
  branch: string;
  variety: string;
  quantity_bales: number;
  fibre_length: number;
  bid_price: number;
  status: string;
  created_at: string;
}

export interface CustomerJob {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  customer_type: 'Mill' | 'Trader' | 'Exporter';
  credit_limit: number;
  outstanding_amount: number;
  region?: string;
  status: 'active' | 'inactive' | 'suspended';
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface BrokerJob {
  id: string;
  broker_id: string;
  broker_name: string;
  broker_email: string;
  broker_phone?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  region?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'suspended';
  total_sales: number;
  total_commission: number;
  created_at: string;
  updated_at: string;
}

export interface LotAllocation {
  id: string;
  sales_id: string;
  lot_number: string;
  indent_number: string;
  allocated_quantity: number;
  status: 'allocated' | 'blocked' | 'released' | 'delivered';
  allocation_date: string;
  blocked_until?: string;
  notes?: string;
}