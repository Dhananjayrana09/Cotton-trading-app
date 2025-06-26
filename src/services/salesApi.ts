import { supabase } from '../lib/supabase';
import type { 
  SalesOrder, 
  AvailableLot, 
  CustomerJob, 
  BrokerJob,
  LotAllocation 
} from '../types/sales';

export class SalesAPI {
  // Sales Order operations
  static async getSalesOrders(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getPendingSalesOrders() {
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .in('status', ['pending', 'admin_review'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createSalesOrder(orderData: Omit<SalesOrder, 'id'>) {
    try {
      // Calculate total amount
      const totalAmount = (orderData.bales_quantity || 0) * (orderData.bid_price || 0);
      
      const { data, error } = await supabase
        .from('sales_table')
        .insert([{
          ...orderData,
          total_amount: totalAmount,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Create lot allocations
      if (orderData.allocated_lots && Array.isArray(orderData.allocated_lots)) {
        const lotAllocations = orderData.allocated_lots.map(lotNumber => ({
          sales_id: data.id,
          lot_number: lotNumber,
          indent_number: orderData.indent_number,
          allocated_quantity: Math.floor((orderData.bales_quantity || 0) / orderData.allocated_lots!.length),
          status: 'allocated'
        }));

        await supabase
          .from('lot_allocations')
          .insert(lotAllocations);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating sales order:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create sales order' };
    }
  }

  static async updateSalesOrderStatus(salesId: string, status: SalesOrder['status'], notes?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.confirmed_by = 'admin'; // In production, this would be the actual admin user ID
    }

    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabase
      .from('sales_table')
      .update(updateData)
      .eq('id', salesId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Available Lots operations
  static async getAvailableLots(indentNumber: string): Promise<AvailableLot[]> {
    const { data, error } = await supabase
      .from('inventory_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .eq('status', 'Available')
      .order('lot_number');

    if (error) throw error;
    return data || [];
  }

  static async blockLots(lotNumbers: string[], salesId: string) {
    // Update inventory status to blocked
    const { error: inventoryError } = await supabase
      .from('inventory_table')
      .update({ status: 'Blocked' })
      .in('lot_number', lotNumbers);

    if (inventoryError) throw inventoryError;

    // Update lot allocations status
    const { error: allocationError } = await supabase
      .from('lot_allocations')
      .update({ 
        status: 'blocked',
        blocked_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Block for 7 days
      })
      .eq('sales_id', salesId);

    if (allocationError) throw allocationError;
  }

  // Customer operations
  static async getCustomers(): Promise<CustomerJob[]> {
    const { data, error } = await supabase
      .from('customer_jobs')
      .select('*')
      .eq('status', 'active')
      .order('customer_name');

    if (error) throw error;
    return data || [];
  }

  static async getCustomerById(customerId: string): Promise<CustomerJob | null> {
    const { data, error } = await supabase
      .from('customer_jobs')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Broker operations
  static async getBrokers(): Promise<BrokerJob[]> {
    const { data, error } = await supabase
      .from('broker_jobs')
      .select('*')
      .eq('status', 'active')
      .order('broker_name');

    if (error) throw error;
    return data || [];
  }

  static async getBrokerById(brokerId: string): Promise<BrokerJob | null> {
    const { data, error } = await supabase
      .from('broker_jobs')
      .select('*')
      .eq('broker_id', brokerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async updateBrokerCommission(brokerId: string, salesAmount: number, commissionRate: number) {
    const commissionAmount = (salesAmount * commissionRate) / 100;

    const { error } = await supabase
      .from('broker_jobs')
      .update({
        total_sales: { increment: salesAmount },
        total_commission: { increment: commissionAmount }
      })
      .eq('broker_id', brokerId);

    if (error) throw error;
  }

  // Lot Allocation operations
  static async getLotAllocations(salesId: string): Promise<LotAllocation[]> {
    const { data, error } = await supabase
      .from('lot_allocations')
      .select('*')
      .eq('sales_id', salesId)
      .order('allocation_date');

    if (error) throw error;
    return data || [];
  }

  // Search and filter operations
  static async searchSalesOrders(searchTerm: string, filters?: {
    status?: string;
    buyer_type?: string;
    date_from?: string;
    date_to?: string;
  }) {
    let query = supabase
      .from('sales_table')
      .select('*');

    if (searchTerm) {
      query = query.or(`indent_number.ilike.%${searchTerm}%,customer_contact->customer_name.ilike.%${searchTerm}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.buyer_type) {
      query = query.eq('buyer_type', filters.buyer_type);
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