import { supabase } from '../lib/supabase';
import type { CottonTradeData, EmailLog, ProcessingLog, ParsingStats } from '../types/cotton';

export class CottonTradingAPI {
  // Cotton Trade Data operations
  static async getCottonTradeData(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('cotton_trade_data')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createCottonTradeData(data: Omit<CottonTradeData, 'id'>) {
    const { data: result, error } = await supabase
      .from('cotton_trade_data')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateCottonTradeData(id: string, updates: Partial<CottonTradeData>) {
    const { data, error } = await supabase
      .from('cotton_trade_data')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Email Logs operations
  static async getEmailLogs(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async createEmailLog(data: Omit<EmailLog, 'id'>) {
    const { data: result, error } = await supabase
      .from('email_logs')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Processing Logs operations
  static async getProcessingLogs(emailLogId?: string, limit = 100) {
    let query = supabase
      .from('processing_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (emailLogId) {
      query = query.eq('email_log_id', emailLogId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async createProcessingLog(data: Omit<ProcessingLog, 'id'>) {
    const { data: result, error } = await supabase
      .from('processing_logs')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Statistics and Analytics
  static async getParsingStats(): Promise<ParsingStats> {
    // Get total emails
    const { count: totalEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });

    // Get successful parsing
    const { count: successfulParsing } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'processed');

    // Get failed parsing
    const { count: failedParsing } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'failed');

    // Get pending review
    const { count: pendingReview } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'pending_review');

    // Get average confidence
    const { data: confidenceData } = await supabase
      .from('email_logs')
      .select('parsing_confidence')
      .not('parsing_confidence', 'is', null);

    const avgConfidence = confidenceData?.length 
      ? confidenceData.reduce((sum, item) => sum + (item.parsing_confidence || 0), 0) / confidenceData.length
      : 0;

    return {
      total_emails: totalEmails || 0,
      successful_parsing: successfulParsing || 0,
      failed_parsing: failedParsing || 0,
      pending_review: pendingReview || 0,
      average_confidence: Math.round(avgConfidence * 100) / 100
    };
  }

  // Data filtering and search
  static async searchCottonTradeData(searchTerm: string, filters?: {
    buyer_type?: string;
    status?: string;
    crop_year?: string;
  }) {
    let query = supabase
      .from('cotton_trade_data')
      .select('*');

    if (searchTerm) {
      query = query.or(`buyer_name.ilike.%${searchTerm}%,firm_name.ilike.%${searchTerm}%,indent_number.ilike.%${searchTerm}%`);
    }

    if (filters?.buyer_type) {
      query = query.eq('buyer_type', filters.buyer_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.crop_year) {
      query = query.eq('crop_year', filters.crop_year);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}