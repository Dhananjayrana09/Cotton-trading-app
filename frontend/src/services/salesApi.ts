import axios from 'axios';
import type { 
  SalesOrder, 
  AvailableLot, 
  CustomerJob, 
  BrokerJob,
  LotAllocation 
} from '../types/sales';

const API_BASE = '/api/sales';

export class SalesAPI {
  // Sales Order operations
  static async getSalesOrders(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async getPendingSalesOrders() {
    const response = await axios.get(`${API_BASE}/pending`);
    return response.data;
  }

  static async createSalesOrder(order: SalesOrder) {
    const response = await axios.post(`${API_BASE}`, order);
    return response.data;
  }

  static async updateSalesOrderStatus(salesId: string, status: SalesOrder['status'], notes?: string) {
    const response = await axios.patch(`${API_BASE}/${salesId}/status`, { status, notes });
    return response.data;
  }

  static async confirmSale(payload: { sale_id: string; indent_number: string; quantity: number; customer_email: string }) {
    const response = await axios.post(`${API_BASE}/confirm`, payload);
    return response.data;
  }

  // Available Lots operations
  static async getAvailableLots(indentNumber: string): Promise<AvailableLot[]> {
    const response = await axios.get(`${API_BASE}/available-lots/${indentNumber}`);
    return response.data;
  }

  static async blockLots(lotNumbers: string[], salesId: string) {
    const response = await axios.post(`${API_BASE}/block-lots`, { lotNumbers, salesId });
    return response.data;
  }

  // Customer operations
  static async getCustomers(): Promise<CustomerJob[]> {
    const response = await axios.get(`${API_BASE}/customers`);
    return response.data;
  }

  static async getCustomerById(customerId: string): Promise<CustomerJob | null> {
    const response = await axios.get(`${API_BASE}/customers/${customerId}`);
    return response.data;
  }

  // Broker operations
  static async getBrokers(): Promise<BrokerJob[]> {
    const response = await axios.get(`${API_BASE}/brokers`);
    return response.data;
  }

  static async getBrokerById(brokerId: string): Promise<BrokerJob | null> {
    const response = await axios.get(`${API_BASE}/brokers/${brokerId}`);
    return response.data;
  }

  // Lot Allocation operations
  static async getLotAllocations(salesId: string): Promise<LotAllocation[]> {
    const response = await axios.get(`${API_BASE}/lot-allocations/${salesId}`);
    return response.data;
  }

  // Search and filter operations
  static async searchSalesOrders(searchTerm: string, filters?: {
    status?: string;
    buyer_type?: string;
    date_from?: string;
    date_to?: string;
  }) {
    let url = `${API_BASE}/search?searchTerm=${encodeURIComponent(searchTerm)}`;
    if (filters?.status) url += `&status=${encodeURIComponent(filters.status)}`;
    if (filters?.buyer_type) url += `&buyer_type=${encodeURIComponent(filters.buyer_type)}`;
    if (filters?.date_from) url += `&date_from=${encodeURIComponent(filters.date_from)}`;
    if (filters?.date_to) url += `&date_to=${encodeURIComponent(filters.date_to)}`;
    const response = await axios.get(url);
    return response.data;
  }
}