// PRODUCTION NOTE: All secrets (Supabase keys, email creds, n8n URLs) must be loaded from .env and never hardcoded.
// TODO: Use CORS whitelist in production. See https://expressjs.com/en/resources/middleware/cors.html
// TODO: Implement JWT authentication for protected endpoints.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './supabaseClient.js';
import paymentRouter from './routes/payment.js';
import contractRoutes from './routes/contract.js';
import samplingRouter from './routes/sampling.js';
import orderRouter from './routes/order.js';
import salesRouter from './routes/sales.js';
import allocationRoutes from './routes/allocation.js';
import emailLogsRouter from './routes/emailLogs.js';
import processingLogsRouter from './routes/processingLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // TODO: Restrict origins in production
app.use(express.json());

// Use routes
app.use('/api/payment', paymentRouter);
app.use('/api/contract', contractRoutes);
app.use('/api/sampling', samplingRouter);
app.use('/api/orders', orderRouter);
app.use('/api/sales', salesRouter);
app.use('/api/allocation', allocationRoutes);
app.use('/api/email-logs', emailLogsRouter);
app.use('/api/processing-logs', processingLogsRouter);

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
        .from('allocation_table')
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
      .from('allocation_table')
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

// Create cotton trading data
app.post('/api/cotton-data', async (req, res) => {
  try {
    const cottonData = req.body;
    const { data, error } = await supabase
      .from('allocation_table')
      .insert([cottonData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating cotton data:', error);
    res.status(500).json({ 
      error: 'Failed to create cotton data', 
      message: error.message 
    });
  }
});

// Update cotton trading data
app.patch('/api/cotton-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('allocation_table')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error updating cotton data:', error);
    res.status(500).json({ 
      error: 'Failed to update cotton data', 
      message: error.message 
    });
  }
});

// Customer Order Validation
app.post('/api/customer-orders/validate', async (req, res) => {
  try {
    const {
      indent_number,
      buyer_type,
      bales_quantity,
      center_name,
      branch,
      date,
      lifting_period,
      fibre_length,
      variety,
      bid_price
    } = req.body;

    // Check if indent number exists in allocation table
    const { data: allocationData, error: allocationError } = await supabase
      .from('allocation_table')
      .select('*')
      .eq('indent_number', indent_number)
      .single();

    if (allocationError || !allocationData) {
      return res.json({
        isValid: false,
        message: `Indent number ${indent_number} not found in allocation table.`,
        allocationData: null,
        quantityCheck: {
          requested: bales_quantity,
          available: 0,
          isValid: false
        }
      });
    }

    // Validate order details against allocation data
    const validationErrors = [];
    
    if (allocationData.center_name !== center_name) {
      validationErrors.push(`Center name mismatch. Expected: ${allocationData.center_name}, Provided: ${center_name}`);
    }
    
    if (allocationData.branch !== branch) {
      validationErrors.push(`Branch mismatch. Expected: ${allocationData.branch}, Provided: ${branch}`);
    }
    
    if (allocationData.variety !== variety) {
      validationErrors.push(`Variety mismatch. Expected: ${allocationData.variety}, Provided: ${variety}`);
    }

    // Check quantity availability
    const quantityCheck = {
      requested: bales_quantity,
      available: allocationData.bales_quantity,
      isValid: bales_quantity <= allocationData.bales_quantity
    };

    if (!quantityCheck.isValid) {
      validationErrors.push(`Requested quantity (${bales_quantity}) exceeds available quantity (${allocationData.bales_quantity})`);
    }

    // Check if bid price is reasonable (within 10% of allocation price)
    const priceDifference = Math.abs(bid_price - allocationData.bid_price);
    const priceThreshold = allocationData.bid_price * 0.1;
    
    if (priceDifference > priceThreshold) {
      validationErrors.push(`Bid price (₹${bid_price}) differs significantly from allocation price (₹${allocationData.bid_price})`);
    }

    const isValid = validationErrors.length === 0 && quantityCheck.isValid;

    res.json({
      isValid,
      message: isValid 
        ? 'Order validation successful. All checks passed.'
        : `Validation failed: ${validationErrors.join(', ')}`,
      allocationData: isValid ? allocationData : null,
      quantityCheck
    });

  } catch (error) {
    console.error('Error validating customer order:', error);
    res.status(500).json({ 
      error: 'Failed to validate order', 
      message: error.message 
    });
  }
});

// Place Customer Order
app.post('/api/customer-orders/place', async (req, res) => {
  try {
    const orderData = req.body;

    // First validate the order
    const validationResponse = await fetch(`${req.protocol}://${req.get('host')}/api/customer-orders/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const validationResult = await validationResponse.json();

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Order validation failed',
        details: validationResult
      });
    }

    // Create customer order record
    const orderRecord = {
      ...orderData,
      status: 'pending',
      created_at: new Date().toISOString(),
      allocation_id: validationResult.allocationData.id,
      // Set default values for optional fields if not provided
      customer_email: orderData.customer_email || null,
      customer_name: orderData.customer_name || null
    };

    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert([orderRecord])
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', orderError);
      throw orderError;
    }

    // Update allocation table to reduce available quantity
    const remainingQuantity = validationResult.allocationData.bales_quantity - orderData.bales_quantity;
    const { error: updateError } = await supabase
      .from('allocation_table')
      .update({ 
        bales_quantity: remainingQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', validationResult.allocationData.id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase
      .from('order_audit_logs')
      .insert([{
        order_id: customerOrder.id,
        indent_number: orderData.indent_number,
        action: 'Order placed',
        details: {
          order_data: orderData,
          validation_result: validationResult
        },
        timestamp: new Date().toISOString()
      }]);

    res.status(201).json({
      success: true,
      order: customerOrder,
      message: 'Order placed successfully',
      remaining_quantity: remainingQuantity
    });

  } catch (error) {
    console.error('Error placing customer order:', error);
    res.status(500).json({ 
      error: 'Failed to place order', 
      message: error.message 
    });
  }
});

// Get Customer Orders
app.get('/api/customer-orders', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('customer_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

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
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer orders', 
      message: error.message 
    });
  }
});

// Get Customer Order by ID
app.get('/api/customer-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching customer order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer order', 
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

// Create email log
app.post('/api/email-logs', async (req, res) => {
  try {
    const emailLogData = req.body;
    const { data, error } = await supabase
      .from('email_logs')
      .insert([emailLogData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating email log:', error);
    res.status(500).json({ 
      error: 'Failed to create email log', 
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

// Create processing log
app.post('/api/processing-logs', async (req, res) => {
  try {
    const processingLogData = req.body;
    const { data, error } = await supabase
      .from('processing_logs')
      .insert([processingLogData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating processing log:', error);
    res.status(500).json({ 
      error: 'Failed to create processing log', 
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

// Supabase connection verification
(async () => {
  try {
    // Try a simple query to check connection
    const { error } = await supabase.from('purchase_contract_table').select('*').limit(1);
    if (error) {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log('Supabase is connected');
    }
  } catch (err) {
    console.error('Supabase connection error:', err.message);
  }
})();

app.listen(PORT, () => {
  // Only keep this startup log
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});