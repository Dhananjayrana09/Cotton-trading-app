import { supabase } from '../lib/supabase';
import type { 
  CostCalculation, 
  PaymentTransaction, 
  EMDDetails, 
  PaymentReminder,
  ZoneTaxRate,
  PaymentStats 
} from '../types/payment';

export class PaymentAPI {
  // Cost Calculation operations
  static async getCostCalculations(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('cost_calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createCostCalculation(data: Omit<CostCalculation, 'id'>) {
    const { data: result, error } = await supabase
      .from('cost_calculations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getCostCalculationByIndent(indentNumber: string) {
    const { data, error } = await supabase
      .from('cost_calculations')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) throw error;
    return data;
  }

  // Payment Transaction operations
  static async getPaymentTransactions(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createPaymentTransaction(data: Omit<PaymentTransaction, 'id'>) {
    const { data: result, error } = await supabase
      .from('payment_transactions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updatePaymentTransaction(paymentId: string, updates: Partial<PaymentTransaction>) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('payment_id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPaymentByIndent(indentNumber: string) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('indent_number', indentNumber)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // EMD Details operations
  static async getEMDDetails(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('emd_details')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createEMDDetails(data: Omit<EMDDetails, 'id'>) {
    const { data: result, error } = await supabase
      .from('emd_details')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateEMDStatus(indentNumber: string, status: EMDDetails['emd_status']) {
    const { data, error } = await supabase
      .from('emd_details')
      .update({ emd_status: status, updated_at: new Date().toISOString() })
      .eq('indent_number', indentNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Zone Tax Rates operations
  static async getZoneTaxRates() {
    const { data, error } = await supabase
      .from('zone_tax_rates')
      .select('*')
      .order('zone');

    if (error) throw error;
    return data;
  }

  static async getTaxRateByZone(zone: string) {
    const { data, error } = await supabase
      .from('zone_tax_rates')
      .select('*')
      .eq('zone', zone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Return default rates if zone not found
    return data || {
      zone: 'Default',
      cgst_rate: 2.5,
      sgst_rate: 2.5,
      igst_rate: 5.0,
      additional_tax: 0
    };
  }

  // Payment Reminders operations
  static async getPaymentReminders(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createPaymentReminder(data: Omit<PaymentReminder, 'id'>) {
    const { data: result, error } = await supabase
      .from('payment_reminders')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getPendingReminders() {
    const { data, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .lte('next_reminder_at', new Date().toISOString())
      .eq('email_sent', false)
      .order('next_reminder_at');

    if (error) throw error;
    return data;
  }

  // Statistics and Analytics
  static async getPaymentStats(): Promise<PaymentStats> {
    // Get total payments
    const { count: totalPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true });

    // Get completed payments
    const { count: completedPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'completed');

    // Get pending payments
    const { count: pendingPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .in('payment_status', ['pending', 'initiated']);

    // Get failed payments
    const { count: failedPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'failed');

    // Get amount statistics
    const { data: amountData } = await supabase
      .from('payment_transactions')
      .select('amount, payment_status');

    const totalAmount = amountData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const completedAmount = amountData?.filter(item => item.payment_status === 'completed')
      .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const pendingAmount = amountData?.filter(item => ['pending', 'initiated'].includes(item.payment_status))
      .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    return {
      total_payments: totalPayments || 0,
      completed_payments: completedPayments || 0,
      pending_payments: pendingPayments || 0,
      failed_payments: failedPayments || 0,
      total_amount: totalAmount,
      completed_amount: completedAmount,
      pending_amount: pendingAmount
    };
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
      // Inter-state: Use IGST
      igstAmount = (baseAmount * taxRates.igst_rate) / 100;
    } else {
      // Intra-state: Use CGST + SGST
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
    let query = supabase
      .from('payment_transactions')
      .select('*');

    if (searchTerm) {
      query = query.or(`payment_id.ilike.%${searchTerm}%,indent_number.ilike.%${searchTerm}%,utr_number.ilike.%${searchTerm}%`);
    }

    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}