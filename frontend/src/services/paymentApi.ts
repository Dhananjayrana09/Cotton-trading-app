import axios from 'axios';
import type { 
  CostCalculation, 
  PaymentTransaction, 
  EMDDetails, 
  PaymentReminder,
  ZoneTaxRate,
  PaymentStats 
} from '../types/payment';

const API_BASE = '/api/payment';

export class PaymentAPI {
  // Cost Calculation operations
  static async getCostCalculations(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}/cost-calculations?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async createCostCalculation(data: Omit<CostCalculation, 'id'>) {
    const response = await axios.post(`${API_BASE}/cost-calculations`, data);
    return response.data;
  }

  static async getCostCalculationByIndent(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/cost-calculations/${indentNumber}`);
    return response.data;
  }

  // Payment Transaction operations
  static async getPaymentTransactions(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}/transactions?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async createPaymentTransaction(data: Omit<PaymentTransaction, 'id'>) {
    const response = await axios.post(`${API_BASE}/transactions`, data);
    return response.data;
  }

  static async updatePaymentTransaction(paymentId: string, updates: Partial<PaymentTransaction>) {
    const response = await axios.patch(`${API_BASE}/transactions/${paymentId}`, updates);
    return response.data;
  }

  // EMD Details operations
  static async getEMDDetails(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}/emd-details?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async createEMDDetails(data: Omit<EMDDetails, 'id'>) {
    const response = await axios.post(`${API_BASE}/emd-details`, data);
    return response.data;
  }

  static async updateEMDStatus(indentNumber: string, status: EMDDetails['emd_status']) {
    const response = await axios.patch(`${API_BASE}/emd-details/${indentNumber}`, { emd_status: status });
    return response.data;
  }

  // Zone Tax Rates operations
  static async getZoneTaxRates() {
    const response = await axios.get(`${API_BASE}/zone-tax-rates`);
    return response.data;
  }

  static async getTaxRateByZone(zone: string) {
    const response = await axios.get(`${API_BASE}/zone-tax-rates/${zone}`);
    return response.data;
  }

  // Payment Reminders operations
  static async getPaymentReminders(limit = 50, offset = 0) {
    const response = await axios.get(`${API_BASE}/reminders?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async createPaymentReminder(data: Omit<PaymentReminder, 'id'>) {
    const response = await axios.post(`${API_BASE}/reminders`, data);
    return response.data;
  }

  static async getPendingReminders() {
    const response = await axios.get(`${API_BASE}/reminders/pending`);
    return response.data;
  }

  // Statistics and Analytics
  static async getPaymentStats(): Promise<PaymentStats> {
    const response = await axios.get(`${API_BASE}/stats`);
    return response.data;
  }

  // Cost calculation helper
  static calculateCosts(
    baseAmount: number, 
    zone: string, 
    taxRates: ZoneTaxRate,
    isInterState: boolean = false
  ): Omit<CostCalculation, 'id' | 'indent_number'> {
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = (baseAmount * taxRates.igst_rate) / 100;
    } else {
      cgstAmount = (baseAmount * taxRates.cgst_rate) / 100;
      sgstAmount = (baseAmount * taxRates.sgst_rate) / 100;
    }

    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const additionalCharges = (baseAmount * (taxRates.additional_tax || 0)) / 100;
    const totalAmount = baseAmount + totalTaxAmount + additionalCharges;

    return {
      base_amount: baseAmount,
      gst_rate: isInterState ? taxRates.igst_rate : (taxRates.cgst_rate + taxRates.sgst_rate),
      cgst_rate: taxRates.cgst_rate,
      sgst_rate: taxRates.sgst_rate,
      igst_rate: taxRates.igst_rate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      gst_amount: totalTaxAmount,
      additional_charges: additionalCharges,
      total_amount: totalAmount,
      zone: zone,
      is_inter_state: isInterState,
      calculation_status: 'calculated'
    };
  }

  // Search and filter operations
  static async searchPayments(searchTerm: string, filters?: {
    payment_status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
  }) {
    let url = `${API_BASE}/transactions/search?searchTerm=${encodeURIComponent(searchTerm)}`;
    if (filters?.payment_status) url += `&payment_status=${encodeURIComponent(filters.payment_status)}`;
    if (filters?.payment_method) url += `&payment_method=${encodeURIComponent(filters.payment_method)}`;
    if (filters?.date_from) url += `&date_from=${encodeURIComponent(filters.date_from)}`;
    if (filters?.date_to) url += `&date_to=${encodeURIComponent(filters.date_to)}`;
    const response = await axios.get(url);
    return response.data;
  }

  // Fetch payment details by indent number
  static async getPaymentByIndent(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/${indentNumber}`);
    return response.data;
  }

  // Calculate GST and update allocation
  static async calculateGST({ indent_number, offer_price, quantity, zone }: { indent_number: string; offer_price: number; quantity: number; zone: string }) {
    const response = await axios.post(`${API_BASE}/calculate-gst`, { indent_number, offer_price, quantity, zone });
    return response.data;
  }

  // Process payment
  static async processPayment({ indent_number, payment_type, amount, transaction_id }: { indent_number: string; payment_type: string; amount: number; transaction_id: string }) {
    const response = await axios.post(`${API_BASE}/process`, { indent_number, payment_type, amount, transaction_id });
    return response.data;
  }

  // (Stubs for invoice and confirmation, to be expanded as needed)
  static async generateInvoice(payload: any) {
    const response = await axios.post(`${API_BASE}/invoice`, payload);
    return response.data;
  }

  static async confirmPayment(payload: any) {
    const response = await axios.post(`${API_BASE}/confirm`, payload);
    return response.data;
  }
}