import axios from 'axios';
import type { AllocationData, SamplingCalculation, InventoryEntry, SamplingAuditLog } from '../types/sampling';

const API_BASE = '/api/sampling';

export class SamplingAPI {
  // Fetch allocation details for sampling
  static async getAllocation(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/allocation/${indentNumber}`);
    return response.data;
  }

  // Calculate default total lots
  static async calculateLots(indentNumber: string, balesQuantity: number) {
    const response = await axios.post(`${API_BASE}/calculate-lots`, { indent_number: indentNumber, bales_quantity: balesQuantity });
    return response.data;
  }

  // Save inventory lots
  static async saveInventory(payload: any) {
    const response = await axios.post(`${API_BASE}/save-inventory`, payload);
    return response.data;
  }

  // Log sampling entry
  static async logSampling(indentNumber: string) {
    const response = await axios.post(`${API_BASE}/log`, { indent_number: indentNumber });
    return response.data;
  }

  // Fetch inventory entries by indent number
  static async getInventoryByIndent(indentNumber: string) {
    const response = await axios.get(`${API_BASE}/inventory/${indentNumber}`);
    return response.data;
  }

  // Validate lot numbers via backend API
  static async validateLotNumbers(
    indentNumber: string,
    lotNumbers: string[],
    allocationData: AllocationData
  ): Promise<{ isValid: boolean; errors: string[]; validatedLots: any[] }> {
    try {
      const response = await axios.post(`${API_BASE}/validate-lots`, {
        indent_number: indentNumber,
        lot_numbers: lotNumbers,
        allocation_data: allocationData
      });

      return response.data;
    } catch (error) {
      console.error('Lot validation error:', error);
      throw error;
    }
  }

  // Submit sampling data via backend API
  static async submitSamplingData(
    indentNumber: string,
    lotNumbers: string[],
    allocationData: AllocationData,
    calculation: SamplingCalculation,
    performedBy: string
  ): Promise<{ success: boolean; message: string; inventory_entries?: InventoryEntry[] }> {
    try {
      const response = await axios.post(`${API_BASE}/submit-sampling`, {
        indent_number: indentNumber,
        lot_numbers: lotNumbers,
        allocation_data: allocationData,
        calculation_details: calculation,
        performed_by: performedBy
      });

      return response.data;
    } catch (error) {
      console.error('Sampling submission error:', error);
      throw error;
    }
  }

  // Get sampling audit logs
  static async getSamplingAuditLogs(indentNumber?: string): Promise<SamplingAuditLog[]> {
    try {
      let url = `${API_BASE}/audit-logs`;
      if (indentNumber) {
        url += `?indentNumber=${encodeURIComponent(indentNumber)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}