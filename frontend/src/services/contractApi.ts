import axios from 'axios';
import type { 
  PurchaseContract, 
  BranchInformation,
  ContractAuditLog,
} from '../types/contract';

const API_BASE = '/api/contract';

export class ContractAPI {
  // Search for procurement details by indent number (calls backend, which calls n8n)
  static async searchIndentNumber(indentNumber: string) {
    const response = await axios.post(`${API_BASE}/search-indent`, { indent_number: indentNumber });
    return response.data;
  }

  // Upload contract (calls backend, which calls n8n)
  static async uploadContract(indentNumber: string, firmName: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('indent_number', indentNumber);
    formData.append('firm_name', firmName);
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Approve and send contract (calls backend, which calls n8n)
  static async approveAndSend(indentNumber: string) {
    const response = await axios.post(`${API_BASE}/approve-send`, { indent_number: indentNumber });
    return response.data;
  }

  // Fetch contract details by indent number
  static async getContractByIndent(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/${indentNumber}`);
    return response.data;
  }

  // Get all purchase contracts
  static async getPurchaseContracts(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Create purchase contract record
  static async createContractRecord(contractData: Omit<PurchaseContract, 'id'>) {
    const response = await axios.post(`${API_BASE}`, contractData);
    return response.data;
  }

  // Update contract status
  static async updateContractStatus(contractId: string, status: string, notes?: string, updatedBy?: string) {
    const response = await axios.patch(`${API_BASE}/${contractId}/status`, { status, notes, updatedBy });
    return response.data;
  }

  // Get branch information by branch name
  static async getBranchInformation(branchName: string): Promise<BranchInformation | null> {
    const response = await axios.get(`${API_BASE}/branch-information/${branchName}`);
    return response.data;
  }

  // Create audit log entry
  static async createAuditLog(logData: Omit<ContractAuditLog, 'id'>) {
    const response = await axios.post(`${API_BASE}/audit-logs`, logData);
    return response.data;
  }

  // Get audit logs for an indent number
  static async getAuditLogs(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/audit-logs/${indentNumber}`);
    return response.data;
  }

  // Get contracts pending approval
  static async getPendingApprovals() {
    const response = await axios.get(`${API_BASE}/pending-approvals`);
    return response.data;
  }
}