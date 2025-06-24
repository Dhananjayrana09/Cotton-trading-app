import { supabase } from '../lib/supabase';
import type { 
  ProcurementDetails, 
  PurchaseContract, 
  BranchInformation,
  ContractAuditLog,
  ContractUploadResponse
} from '../types/contract';

export class ContractAPI {
  // Search for procurement details by indent number
  static async searchIndentNumber(indentNumber: string): Promise<ProcurementDetails | null> {
    const { data, error } = await supabase
      .from('procurement_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No data found
      }
      throw error;
    }
    return data;
  }

  // Get all purchase contracts
  static async getPurchaseContracts(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get purchase contract by indent number
  static async getContractByIndent(indentNumber: string): Promise<PurchaseContract | null> {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  }

  // Create purchase contract record
  static async createContractRecord(contractData: Omit<PurchaseContract, 'id'>) {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .insert(contractData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update contract status
  static async updateContractStatus(
    contractId: string, 
    status: PurchaseContract['upload_status'],
    adminNotes?: string,
    approvedBy?: string
  ) {
    const updateData: any = {
      upload_status: status,
      admin_notes: adminNotes
    };

    if (status === 'approved' && approvedBy) {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('purchase_contract_table')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get branch information by branch name
  static async getBranchInformation(branchName: string): Promise<BranchInformation | null> {
    const { data, error } = await supabase
      .from('branch_information')
      .select('*')
      .eq('branch_name', branchName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  }

  // Create audit log entry
  static async createAuditLog(logData: Omit<ContractAuditLog, 'id'>) {
    const { data, error } = await supabase
      .from('contract_audit_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get audit logs for an indent number
  static async getAuditLogs(indentNumber: string) {
    const { data, error } = await supabase
      .from('contract_audit_logs')
      .select('*')
      .eq('indent_number', indentNumber)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get contracts pending approval
  static async getPendingApprovals() {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('upload_status', 'pending_approval')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Upload contract file (this will be handled by n8n workflow)
  static async uploadContract(
    indentNumber: string,
    firmName: string,
    file: File,
    uploadedBy: string
  ): Promise<ContractUploadResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('indent_number', indentNumber);
      formData.append('firm_name', firmName);
      formData.append('uploaded_by', uploadedBy);

      // Call n8n webhook for contract upload
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/contract-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Contract upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
}