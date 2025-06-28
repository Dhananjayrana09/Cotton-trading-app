import axios from 'axios';
import type { CottonTradeData, EmailLog, ProcessingLog} from '../types/cotton';

const API_BASE = '/api/allocation';

export class CottonTradingAPI {
  // Cotton Trade Data operations
  static async getCottonTradeData(limit = 50, offset = 0) {
    const response = await axios.get(`/api/cotton-data?limit=${limit}&offset=${offset}`);
    return Array.isArray(response.data) ? response.data : [];
  }

  static async createCottonTradeData(data: Omit<CottonTradeData, 'id'>) {
    const response = await axios.post(`/api/cotton-data`, data);
    return response.data;
  }

  static async updateCottonTradeData(id: string, updates: Partial<CottonTradeData>) {
    const response = await axios.patch(`/api/cotton-data/${id}`, updates);
    return response.data;
  }

  // Email Logs operations
  static async getEmailLogs(limit = 50, offset = 0) {
    const response = await axios.get(`/api/email-logs?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async createEmailLog(data: Omit<EmailLog, 'id'>) {
    const response = await axios.post(`/api/email-logs`, data);
    return response.data;
  }

  // Processing Logs operations
  static async getProcessingLogs(emailLogId?: string, limit = 100) {
    let url = `/api/processing-logs?limit=${limit}`;
    if (emailLogId) {
      url += `&emailLogId=${emailLogId}`;
    }
    const response = await axios.get(url);
    return response.data;
  }

  static async createProcessingLog(data: Omit<ProcessingLog, 'id'>) {
    const response = await axios.post(`/api/processing-logs`, data);
    return response.data;
  }

  // Statistics and Analytics
  static async getParsingStats(): Promise<{
    total: number;
    received: number;
    processed: number;
    pending_review: number;
    failed: number;
  }> {
    const response = await axios.get(`/api/email-logs/stats/summary`);
    return response.data;
  }

  // Get email logs statistics (alternative method)
  static async getEmailLogsStats() {
    const response = await axios.get(`/api/email-logs/stats/summary`);
    return response.data;
  }

  // Data filtering and search
  static async searchCottonTradeData(searchTerm: string, filters?: {
    buyer_type?: string;
    status?: string;
    crop_year?: string;
  }) {
    let url = `${API_BASE}/search?searchTerm=${encodeURIComponent(searchTerm)}`;
    if (filters?.buyer_type) url += `&buyer_type=${encodeURIComponent(filters.buyer_type)}`;
    if (filters?.status) url += `&status=${encodeURIComponent(filters.status)}`;
    if (filters?.crop_year) url += `&crop_year=${encodeURIComponent(filters.crop_year)}`;
    const response = await axios.get(url);
    return response.data;
  }
}

export class AllocationAPI {
  // Fetch allocation details by indent number
  static async getAllocation(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/${indentNumber}`);
    return response.data;
  }

  // Log allocation action
  static async logAllocationAction(indentNumber: string, action: string, details?: any) {
    const response = await axios.post(`${API_BASE}/log`, {
      indent_number: indentNumber,
      action,
      details,
    });
    return response.data;
  }

  // Update allocation status/details
  static async updateAllocation(indentNumber: string, updates: Record<string, any>) {
    const response = await axios.patch(`${API_BASE}/${indentNumber}`, updates);
    return response.data;
  }

  // Fetch all allocations
  static async getAllAllocations() {
    console.log('Calling getAllAllocations API...');
    const response = await axios.get(`${API_BASE}`);
    console.log('API response:', response.data);
    return response.data;
  }
}

export class CustomerOrderAPI {
  // Validate customer order against allocation table
  static async validateOrder(orderData: {
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
  }) {
    const response = await axios.post('/api/customer-orders/validate', orderData);
    return response.data;
  }

  // Place customer order
  static async placeOrder(orderData: {
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
    customer_email?: string;
    customer_name?: string;
  }) {
    const response = await axios.post('/api/customer-orders/place', orderData);
    return response.data;
  }

  // Get customer orders
  static async getCustomerOrders(limit = 50, offset = 0) {
    const response = await axios.get(`/api/customer-orders?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Get customer order by ID
  static async getCustomerOrder(orderId: string) {
    const response = await axios.get(`/api/customer-orders/${orderId}`);
    return response.data;
  }
}