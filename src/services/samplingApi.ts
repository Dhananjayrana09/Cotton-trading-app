import { supabase } from '../lib/supabase';
import type { AllocationData, SamplingCalculation, InventoryEntry, SamplingAuditLog } from '../types/sampling';

export class SamplingAPI {
  // Search for allocation data by indent number
  static async searchAllocation(indentNumber: string): Promise<AllocationData | null> {
    try {
      const { data, error } = await supabase
        .from('procurement_table') // Changed from allocation_table to procurement_table for testing
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
    } catch (error) {
      console.error('Error searching allocation:', error);
      throw error;
    }
  }

  // Calculate sampling defaults
  static calculateSamplingDefaults(balesQuantity: number): SamplingCalculation {
    const base = Math.floor(balesQuantity / 100);
    let extra = Math.floor(base * 0.2);
    
    if (extra < 1) {
      extra = 0;
    }
    
    const total = base + extra;
    
    return {
      base,
      extra,
      total
    };
  }

  // Validate lot numbers via n8n workflow
  static async validateLotNumbers(
    indentNumber: string,
    lotNumbers: string[],
    allocationData: AllocationData
  ): Promise<{ isValid: boolean; errors: string[]; validatedLots: any[] }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/sampling-validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indent_number: indentNumber,
          lot_numbers: lotNumbers,
          allocation_data: allocationData
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Lot validation error:', error);
      throw error;
    }
  }

  // Submit sampling data via n8n workflow
  static async submitSamplingData(
    indentNumber: string,
    lotNumbers: string[],
    allocationData: AllocationData,
    calculation: SamplingCalculation,
    performedBy: string
  ): Promise<{ success: boolean; message: string; inventory_entries?: InventoryEntry[] }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/sampling-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indent_number: indentNumber,
          lot_numbers: lotNumbers,
          allocation_data: allocationData,
          calculation_details: calculation,
          performed_by: performedBy
        }),
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Sampling submission error:', error);
      throw error;
    }
  }

  // Get inventory entries by indent number
  static async getInventoryByIndent(indentNumber: string): Promise<InventoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_table')
        .select('*')
        .eq('indent_number', indentNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get sampling audit logs
  static async getSamplingAuditLogs(indentNumber?: string): Promise<SamplingAuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'Sampling Entry')
        .order('created_at', { ascending: false });

      if (indentNumber) {
        query = query.eq('indent_number', indentNumber);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}