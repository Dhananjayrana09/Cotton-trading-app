import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import paymentRoutes from './paymentRoutes.js';
import contractRoutes from './contractRoutes.js';
import samplingRoutes from './samplingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use routes
app.use('/api/payment', paymentRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/sampling', samplingRoutes);

// Email processing webhook - this would be called by n8n
app.post('/api/webhook/email-received', async (req, res) => {
  try {
    const { 
      subject, 
      sender, 
      receivedAt, 
      hasPdf, 
      pdfFilename, 
      pdfS3Url 
    } = req.body;

    // Validate email subject
    if (subject !== 'Sale Confirmation of FP Bales') {
      return res.status(400).json({ 
        error: 'Invalid email subject', 
        message: 'Only emails with subject "Sale Confirmation of FP Bales" are processed' 
      });
    }

    // Log email reception
    const { data: emailLog, error: emailError } = await supabase
      .from('email_logs')
      .insert([{
        email_subject: subject,
        sender_email: sender,
        received_at: receivedAt,
        has_pdf: hasPdf,
        pdf_filename: pdfFilename,
        pdf_s3_url: pdfS3Url,
        processing_status: hasPdf ? 'received' : 'failed',
        error_message: hasPdf ? null : 'No PDF attachment found'
      }])
      .select()
      .single();

    if (emailError) {
      throw emailError;
    }

    // Log processing step
    await supabase
      .from('processing_logs')
      .insert([{
        email_log_id: emailLog.id,
        processing_stage: 'email_reception',
        status: 'success',
        message: 'Email successfully received and logged'
      }]);

    res.json({ 
      success: true, 
      emailLogId: emailLog.id,
      message: 'Email processed successfully' 
    });

  } catch (error) {
    console.error('Email processing error:', error);
    res.status(500).json({ 
      error: 'Email processing failed', 
      message: error.message 
    });
  }
});

// PDF parsing webhook - this would be called by n8n after OCR processing
app.post('/api/webhook/pdf-parsed', async (req, res) => {
  try {
    const { 
      emailLogId, 
      parsingConfidence, 
      extractedData,
      parseSuccess 
    } = req.body;

    // Update email log with parsing results
    const { error: updateError } = await supabase
      .from('email_logs')
      .update({
        parsing_confidence: parsingConfidence,
        processing_status: parseSuccess 
          ? (parsingConfidence > 80 ? 'processed' : 'pending_review')
          : 'failed'
      })
      .eq('id', emailLogId);

    if (updateError) {
      throw updateError;
    }

    // If parsing was successful and confidence is high, save the extracted data
    if (parseSuccess && parsingConfidence > 80) {
      const { error: dataError } = await supabase
        .from('cotton_trade_data')
        .insert([{
          ...extractedData,
          parsing_confidence: parsingConfidence,
          status: 'approved',
          created_by: 'system'
        }]);

      if (dataError) {
        throw dataError;
      }

      // Log success
      await supabase
        .from('processing_logs')
        .insert([{
          email_log_id: emailLogId,
          processing_stage: 'data_extraction',
          status: 'success',
          message: `Data extracted and saved with ${parsingConfidence}% confidence`,
          details: extractedData
        }]);

    } else if (parseSuccess && parsingConfidence <= 80) {
      // Log for manual review
      await supabase
        .from('processing_logs')
        .insert([{
          email_log_id: emailLogId,
          processing_stage: 'data_extraction',
          status: 'warning',
          message: `Low confidence parsing (${parsingConfidence}%) - flagged for manual review`,
          details: extractedData
        }]);
    } else {
      // Log parsing failure
      await supabase
        .from('processing_logs')
        .insert([{
          email_log_id: emailLogId,
          processing_stage: 'data_extraction',
          status: 'error',
          message: 'PDF parsing failed'
        }]);
    }

    res.json({ 
      success: true, 
      message: 'PDF parsing results processed successfully' 
    });

  } catch (error) {
    console.error('PDF parsing processing error:', error);
    res.status(500).json({ 
      error: 'PDF parsing processing failed', 
      message: error.message 
    });
  }
});

// Contract upload webhook - called by n8n for contract processing
app.post('/api/webhook/contract-uploaded', async (req, res) => {
  try {
    const {
      indent_number,
      firm_name,
      contract_filename,
      contract_s3_url,
      uploaded_by
    } = req.body;

    // Create contract record in database
    const { data: contract, error: contractError } = await supabase
      .from('purchase_contract_table')
      .insert([{
        indent_number,
        firm_name,
        contract_filename,
        contract_s3_url,
        upload_status: 'pending_approval',
        uploaded_by,
        uploaded_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (contractError) {
      throw contractError;
    }

    // Create audit log
    await supabase
      .from('contract_audit_logs')
      .insert([{
        indent_number,
        action: 'Contract uploaded',
        performed_by: uploaded_by,
        details: {
          contract_id: contract.id,
          filename: contract_filename,
          s3_url: contract_s3_url
        },
        timestamp: new Date().toISOString()
      }]);

    res.json({
      success: true,
      contract_id: contract.id,
      message: 'Contract uploaded successfully and admin notified'
    });

  } catch (error) {
    console.error('Contract upload processing error:', error);
    res.status(500).json({
      error: 'Contract upload processing failed',
      message: error.message
    });
  }
});

// Contract approval webhook - called by n8n after admin approval
app.post('/api/webhook/contract-approved', async (req, res) => {
  try {
    const {
      contract_id,
      indent_number,
      branch_email,
      admin_notes
    } = req.body;

    // Create audit log for approval
    await supabase
      .from('contract_audit_logs')
      .insert([{
        indent_number,
        action: 'Contract approved and sent to branch',
        performed_by: 'admin',
        details: {
          contract_id,
          branch_email,
          admin_notes
        },
        timestamp: new Date().toISOString()
      }]);

    res.json({
      success: true,
      message: 'Contract approval logged successfully'
    });

  } catch (error) {
    console.error('Contract approval processing error:', error);
    res.status(500).json({
      error: 'Contract approval processing failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get cotton trading data
app.get('/api/cotton-data', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('cotton_trade_data')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`buyer_name.ilike.%${search}%,firm_name.ilike.%${search}%,indent_number.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching cotton data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cotton data', 
      message: error.message 
    });
  }
});

// Get email logs
app.get('/api/email-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('processing_status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch email logs', 
      message: error.message 
    });
  }
});

// Get processing logs
app.get('/api/processing-logs', async (req, res) => {
  try {
    const { emailLogId, limit = 100 } = req.query;

    let query = supabase
      .from('processing_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (emailLogId) {
      query = query.eq('email_log_id', emailLogId);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ data });

  } catch (error) {
    console.error('Error fetching processing logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch processing logs', 
      message: error.message 
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Get email stats
    const { count: totalEmails } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });

    const { count: successfulParsing } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'processed');

    const { count: failedParsing } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'failed');

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

    res.json({
      total_emails: totalEmails || 0,
      successful_parsing: successfulParsing || 0,
      failed_parsing: failedParsing || 0,
      pending_review: pendingReview || 0,
      average_confidence: Math.round(avgConfidence * 100) / 100
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});