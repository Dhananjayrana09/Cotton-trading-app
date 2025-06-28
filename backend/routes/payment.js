// import express from 'express';
// import supabase from '../supabaseClient.js';

// const router = express.Router();

// // Get cost calculations
// router.get('/cost-calculations', async (req, res) => {
//   try {
//     const { limit = 50, offset = 0 } = req.query;
    
//     const { data, error } = await supabase
//       .from('cost_calculations')
//       .select('*')
//       .order('created_at', { ascending: false })
//       .range(offset, offset + limit - 1);
    
//     if (error) throw error;
//     res.json(data || []);
//   } catch (error) {
//     console.error('Error fetching cost calculations:', error);
//     res.status(500).json({ error: 'Failed to fetch cost calculations', message: error.message });
//   }
// });

// // Get transactions
// router.get('/transactions', async (req, res) => {
//   try {
//     const { limit = 50, offset = 0 } = req.query;
    
//     const { data, error } = await supabase
//       .from('payment_transactions')
//       .select('*')
//       .order('created_at', { ascending: false })
//       .range(offset, offset + limit - 1);
    
//     if (error) throw error;
//     res.json(data || []);
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
//   }
// });

// // Get payment stats
// router.get('/stats', async (req, res) => {
//   try {
//     // Get total payments
//     const { data: totalPayments, error: paymentsError } = await supabase
//       .from('payment_transactions')
//       .select('amount', { count: 'exact' });
    
//     if (paymentsError) throw paymentsError;
    
//     // Get pending payments
//     const { data: pendingPayments, error: pendingError } = await supabase
//       .from('payment_transactions')
//       .select('amount')
//       .eq('status', 'pending');
    
//     if (pendingError) throw pendingError;
    
//     // Get completed payments
//     const { data: completedPayments, error: completedError } = await supabase
//       .from('payment_transactions')
//       .select('amount')
//       .eq('status', 'completed');
    
//     if (completedError) throw completedError;
    
//     // Calculate totals
//     const totalAmount = totalPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
//     const pendingAmount = pendingPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
//     const completedAmount = completedPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    
//     res.json({
//       totalPayments: totalPayments?.length || 0,
//       totalAmount,
//       pendingPayments: pendingPayments?.length || 0,
//       pendingAmount,
//       completedPayments: completedPayments?.length || 0,
//       completedAmount
//     });
//   } catch (error) {
//     console.error('Error fetching payment stats:', error);
//     res.status(500).json({ error: 'Failed to fetch payment stats', message: error.message });
//   }
// });

// // Get zone tax rates
// router.get('/zone-tax-rates', async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('zone_tax_rates')
//       .select('*');
    
//     if (error) throw error;
//     res.json(data || []);
//   } catch (error) {
//     console.error('Error fetching zone tax rates:', error);
//     res.status(500).json({ error: 'Failed to fetch zone tax rates', message: error.message });
//   }
// });

// // Get tax rate by zone
// router.get('/zone-tax-rates/:zone', async (req, res) => {
//   try {
//     const { zone } = req.params;
//     const { data, error } = await supabase
//       .from('zone_tax_rates')
//       .select('*')
//       .eq('zone', zone)
//       .single();
    
//     if (error) throw error;
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching tax rate for zone:', error);
//     res.status(500).json({ error: 'Failed to fetch tax rate for zone', message: error.message });
//   }
// });

// // Fetch payment details by indent number
// router.get('/:indent_number', async (req, res) => {
//   try {
//     const { indent_number } = req.params;
//     const { data, error } = await supabase
//       .from('payment_details')
//       .select('*')
//       .eq('indent_number', indent_number)
//       .order('created_at', { ascending: false });
//     if (error) throw error;
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching payment details:', error);
//     res.status(500).json({ error: 'Failed to fetch payment details', message: error.message });
//   }
// });

// // Calculate GST and update allocation
// router.post('/calculate-gst', async (req, res) => {
//   try {
//     const { indent_number, offer_price, quantity, zone } = req.body;
//     let cgst_percentage = 0;
//     let sgst_percentage = 0;
//     if (zone === 'North') {
//       cgst_percentage = 5;
//       sgst_percentage = 5;
//     } else if (zone === 'South') {
//       cgst_percentage = 6;
//       sgst_percentage = 6;
//     } else {
//       cgst_percentage = 2.5;
//       sgst_percentage = 2.5;
//     }
//     const cgst_amount = (offer_price * quantity * cgst_percentage) / 100;
//     const sgst_amount = (offer_price * quantity * sgst_percentage) / 100;
//     const gst_amount = cgst_amount + sgst_amount;
//     const total_amount = offer_price * quantity + gst_amount;
//     const { data, error } = await supabase
//       .from('allocation_details')
//       .update({ cgst_percentage, sgst_percentage, cgst_amount, sgst_amount, gst_amount, total_amount })
//       .eq('indent_number', indent_number)
//       .select();
//     if (error) throw error;
//     res.json(data[0]);
//   } catch (error) {
//     console.error('Error calculating GST:', error);
//     res.status(500).json({ error: 'Failed to calculate GST', message: error.message });
//   }
// });

// // Process payment and update status
// router.post('/process-payment', async (req, res) => {
//   try {
//     const { indent_number, payment_type, amount, transaction_id, utr_number, created_by } = req.body;
//     if (!indent_number || !amount) {
//       return res.status(400).json({ error: 'indent_number and amount are required' });
//     }
//     const { data, error } = await supabase
//       .from('payment_details')
//       .insert({
//         indent_number,
//         payment_type: payment_type || null,
//         amount,
//         transaction_id: transaction_id || null,
//         utr_number: utr_number || null,
//         status: 'pending',
//         payment_date: new Date().toISOString().split('T')[0],
//         created_by: created_by || 'system',
//         created_at: new Date().toISOString(),
//       })
//       .select();
//     if (error) throw error;
//     res.status(201).json({ message: 'Payment processed', data: data[0] });
//   } catch (error) {
//     console.error('Error processing payment:', error);
//     res.status(500).json({ error: 'Failed to process payment', message: error.message });
//   }
// });

// // Generate invoice (stub, to be expanded as needed)
// router.post('/invoice', async (req, res) => {
//   // Implementation placeholder
//   res.json({ message: 'Invoice generation endpoint (to be implemented)' });
// });

// // Confirm payment and mark as closed if UTR is present
// router.post('/confirm-payment', async (req, res) => {
//   try {
//     const { indent_number, utr_number } = req.body;
//     if (!indent_number || !utr_number) {
//       return res.status(400).json({ error: 'indent_number and utr_number are required' });
//     }
//     // Update payment status to confirmed
//     const { data, error } = await supabase
//       .from('payment_details')
//       .update({
//         utr_number,
//         status: 'confirmed',
//         closed: true,
//         closed_at: new Date().toISOString(),
//       })
//       .eq('indent_number', indent_number)
//       .eq('utr_number', utr_number)
//       .select();
//     if (error) throw error;
//     res.json({ message: 'Payment confirmed and closed', data: data[0] });
//   } catch (error) {
//     console.error('Error confirming payment:', error);
//     res.status(500).json({ error: 'Failed to confirm payment', message: error.message });
//   }
// });

// // Create cost calculation
// router.post('/cost-calculations', async (req, res) => {
//   try {
//     const calculationData = req.body;
//     const { data, error } = await supabase
//       .from('cost_calculations')
//       .insert({
//         ...calculationData,
//         created_at: new Date().toISOString(),
//       })
//       .select();
    
//     if (error) throw error;
//     res.json(data[0]);
//   } catch (error) {
//     console.error('Error creating cost calculation:', error);
//     res.status(500).json({ error: 'Failed to create cost calculation', message: error.message });
//   }
// });

// // Get cost calculation by indent number
// router.get('/cost-calculations/:indent_number', async (req, res) => {
//   try {
//     const { indent_number } = req.params;
//     const { data, error } = await supabase
//       .from('cost_calculations')
//       .select('*')
//       .eq('indent_number', indent_number)
//       .order('created_at', { ascending: false });
    
//     if (error) throw error;
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching cost calculation:', error);
//     res.status(500).json({ error: 'Failed to fetch cost calculation', message: error.message });
//   }
// });

// // Process EMD details and store in Supabase
// router.post('/emd/process', async (req, res) => {
//   try {
//     const { indent_number, emd_amount, emd_date, buyer_type, branch, zone, created_by } = req.body;
//     if (!indent_number || !emd_amount || !emd_date) {
//       return res.status(400).json({ error: 'indent_number, emd_amount, and emd_date are required' });
//     }
//     const { data, error } = await supabase
//       .from('emd_table')
//       .insert({
//         indent_number,
//         emd_amount,
//         emd_date,
//         buyer_type: buyer_type || null,
//         branch: branch || null,
//         zone: zone || null,
//         created_by: created_by || 'system',
//         created_at: new Date().toISOString(),
//       })
//       .select();
//     if (error) throw error;
//     res.status(201).json({ message: 'EMD processed', data: data[0] });
//   } catch (error) {
//     console.error('Error processing EMD:', error);
//     res.status(500).json({ error: 'Failed to process EMD', message: error.message });
//   }
// });

// // Check EMD date validity
// router.post('/emd/check-date', async (req, res) => {
//   try {
//     const { emd_date } = req.body;
//     if (!emd_date) {
//       return res.status(400).json({ valid: false, error: 'emd_date is required' });
//     }
//     const today = new Date();
//     const emdDate = new Date(emd_date);
//     if (isNaN(emdDate.getTime())) {
//       return res.status(400).json({ valid: false, error: 'Invalid date format' });
//     }
//     if (emdDate < today.setHours(0,0,0,0)) {
//       return res.status(400).json({ valid: false, error: 'EMD date is in the past' });
//     }
//     res.json({ valid: true });
//   } catch (error) {
//     console.error('Error checking EMD date:', error);
//     res.status(500).json({ valid: false, error: 'Failed to check EMD date', message: error.message });
//   }
// });

// // Log errors to processing_logs table
// router.post('/log-error', async (req, res) => {
//   try {
//     const { error_type, message, details, indent_number } = req.body;
//     if (!error_type || !message) {
//       return res.status(400).json({ error: 'error_type and message are required' });
//     }
//     const { data, error } = await supabase
//       .from('processing_logs')
//       .insert({
//         error_type,
//         message,
//         details: details || null,
//         indent_number: indent_number || null,
//         created_at: new Date().toISOString(),
//       })
//       .select();
//     if (error) throw error;
//     res.status(201).json({ message: 'Error logged', data: data[0] });
//   } catch (error) {
//     console.error('Error logging error:', error);
//     res.status(500).json({ error: 'Failed to log error', message: error.message });
//   }
// });

// export default router; 


import express from 'express';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import winston from 'winston';
import supabase from '../supabaseClient.js';


// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const router = express.Router();

// Get cost calculations
router.get('/cost-calculations', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('cost_calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error fetching cost calculations:', error);
    await logAction(null, 'Fetch Cost Calculations Error', error.message);
    res.status(500).json({ error: 'Failed to fetch cost calculations', message: error.message });
  }
});

// Get transactions
router.get('/transactions', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    await logAction(null, 'Fetch Transactions Error', error.message);
    res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
  }
});

// Get payment stats
router.get('/stats', async (req, res) => {
  try {
    const { data: totalPayments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select('amount', { count: 'exact' });
    
    if (paymentsError) throw paymentsError;
    
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'pending');
    
    if (pendingError) throw pendingError;
    
    const { data: completedPayments, error: completedError } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'completed');
    
    if (completedError) throw completedError;
    
    const totalAmount = totalPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const pendingAmount = pendingPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const completedAmount = completedPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    
    res.json({
      totalPayments: totalPayments?.length || 0,
      totalAmount,
      pendingPayments: pendingPayments?.length || 0,
      pendingAmount,
      completedPayments: completedPayments?.length || 0,
      completedAmount
    });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    await logAction(null, 'Fetch Payment Stats Error', error.message);
    res.status(500).json({ error: 'Failed to fetch payment stats', message: error.message });
  }
});

// Get zone tax rates
router.get('/zone-tax-rates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('zone_tax_rates')
      .select('*');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error fetching zone tax rates:', error);
    await logAction(null, 'Fetch Zone Tax Rates Error', error.message);
    res.status(500).json({ error: 'Failed to fetch zone tax rates', message: error.message });
  }
});

// Get tax rate by zone
router.get('/zone-tax-rates/:zone', async (req, res) => {
  try {
    const { zone } = req.params;
    const { data, error } = await supabase
      .from('zone_tax_rates')
      .select('*')
      .eq('zone', zone)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error fetching tax rate for zone:', error);
    await logAction(null, 'Fetch Tax Rate Error', error.message);
    res.status(500).json({ error: 'Failed to fetch tax rate for zone', message: error.message });
  }
});

// Fetch payment details by indent number
router.get('/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const { data, error } = await supabase
      .from('payment_details')
      .select('*')
      .eq('indent_number', indent_number)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error fetching payment details:', error);
    await logAction(indent_number, 'Fetch Payment Details Error', error.message);
    res.status(500).json({ error: 'Failed to fetch payment details', message: error.message });
  }
});

// Calculate GST and update allocation with OTP and lifting period adjustment
router.post('/calculate-gst', async (req, res) => {
  try {
    const { indent_number, offer_price, quantity, zone, lifting_period, cci_discount } = req.body;

    // Fetch tax rates dynamically
    const { data: taxRate, error: taxError } = await supabase
      .from('zone_tax_rates')
      .select('cgst_percentage, sgst_percentage')
      .eq('zone', zone)
      .single();

    if (taxError || !taxRate) throw new Error('Tax rate not found');

    const { cgst_percentage, sgst_percentage } = taxRate;
    const cgst_amount = (offer_price * quantity * cgst_percentage) / 100;
    const sgst_amount = (offer_price * quantity * sgst_percentage) / 100;
    const gst_amount = cgst_amount + sgst_amount;

    // Calculate OTP
    const otp = offer_price - (cci_discount || 0);

    // Adjust lifting period (deduct 2 days)
    const liftingDate = new Date(lifting_period);
    liftingDate.setDate(liftingDate.getDate() - 2);
    const adjusted_lifting_period = liftingDate.toISOString().split('T')[0];

    const total_amount = (offer_price * quantity) + gst_amount + otp;
    const { data, error } = await supabase
      .from('allocation_details')
      .update({
        cgst_percentage,
        sgst_percentage,
        cgst_amount,
        sgst_amount,
        gst_amount,
        otp,
        total_amount,
        lifting_period: adjusted_lifting_period,
      })
      .eq('indent_number', indent_number)
      .select();

    if (error) throw error;
    await logAction(indent_number, 'GST Calculated', `GST: ${gst_amount}, OTP: ${otp}`);
    res.json(data[0]);
  } catch (error) {
    await logAction(indent_number || 'unknown', 'GST Calculation Error', error.message);
    res.status(500).json({ error: 'Failed to calculate GST', message: error.message });
  }
});

// Process payment and update status
router.post('/process-payment', async (req, res) => {
  try {
    const { indent_number, payment_type, amount, transaction_id, utr_number, created_by } = req.body;
    if (!indent_number || !amount) {
      return res.status(400).json({ error: 'indent_number and amount are required' });
    }
    const { data, error } = await supabase
      .from('payment_details')
      .insert({
        indent_number,
        payment_type: payment_type || null,
        amount,
        transaction_id: transaction_id || null,
        utr_number: utr_number || null,
        status: 'pending',
        payment_date: new Date().toISOString().split('T')[0],
        created_by: created_by || 'system',
        created_at: new Date().toISOString(),
      })
      .select();
    if (error) throw error;
    await logAction(indent_number, 'Payment Processed', `Amount: ${amount}, Status: pending`);
    res.status(201).json({ message: 'Payment processed', data: data[0] });
  } catch (error) {
    await logAction(indent_number || 'unknown', 'Payment Processing Error', error.message);
    res.status(500).json({ error: 'Failed to process payment', message: error.message });
  }
});

// Generate invoice with PDF
router.post('/invoice', async (req, res) => {
  try {
    const { indent_number, amount, bank_details, payment_type } = req.body;

    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const pdfPath = `payment-advice/${indent_number}_invoice.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('payment-advice')
        .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const paymentId = `INV-${Date.now()}`;
      const { error: insertError } = await supabase
        .from('Payment_Advice_Table')
        .insert({
          payment_id: paymentId,
          indent_number,
          amount,
          bank_details,
          transaction_date: new Date(),
          payment_type,
          pdf_path: pdfPath,
        });

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'admin@example.com',
        subject: `Invoice Generated: ${indent_number}`,
        text: `Invoice for ${indent_number} has been uploaded.`,
      });

      await logAction(indent_number, 'Invoice Generated', `Payment ID: ${paymentId}`);
      res.status(200).json({ message: 'Invoice generated', payment_id: paymentId });
    });

    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.fontSize(12).text(`Indent Number: ${indent_number}`);
    doc.text(`Amount: $${amount}`);
    doc.text(`Bank Details: ${bank_details}`);
    doc.text(`Payment Type: ${payment_type}`);
    doc.text(`Date: ${new Date().toISOString()}`);
    doc.end();
  } catch (error) {
    await logAction(indent_number || 'unknown', 'Invoice Generation Error', error.message);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

// Confirm payment and mark as closed if UTR is present
router.post('/confirm-payment', async (req, res) => {
  try {
    const { indent_number, utr_number } = req.body;
    if (!indent_number || !utr_number) {
      return res.status(400).json({ error: 'indent_number and utr_number are required' });
    }
    const { data, error } = await supabase
      .from('payment_details')
      .update({
        utr_number,
        status: 'confirmed',
        closed: true,
        closed_at: new Date().toISOString(),
      })
      .eq('indent_number', indent_number)
      .eq('utr_number', utr_number)
      .select();
    if (error) throw error;
    await logAction(indent_number, 'Payment Confirmed', `UTR: ${utr_number}`);
    res.json({ message: 'Payment confirmed and closed', data: data[0] });
  } catch (error) {
    await logAction(indent_number || 'unknown', 'Payment Confirmation Error', error.message);
    res.status(500).json({ error: 'Failed to confirm payment', message: error.message });
  }
});

// Create cost calculation
router.post('/cost-calculations', async (req, res) => {
  try {
    const calculationData = req.body;
    const { data, error } = await supabase
      .from('cost_calculations')
      .insert({
        ...calculationData,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) throw error;
    await logAction(calculationData.indent_number, 'Cost Calculation Created', 'Success');
    res.json(data[0]);
  } catch (error) {
    await logAction(calculationData.indent_number || 'unknown', 'Cost Calculation Error', error.message);
    res.status(500).json({ error: 'Failed to create cost calculation', message: error.message });
  }
});

// Get cost calculation by indent number
router.get('/cost-calculations/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const { data, error } = await supabase
      .from('cost_calculations')
      .select('*')
      .eq('indent_number', indent_number)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error fetching cost calculation:', error);
    await logAction(indent_number, 'Fetch Cost Calculation Error', error.message);
    res.status(500).json({ error: 'Failed to fetch cost calculation', message: error.message });
  }
});

// Process EMD details and store in Supabase
router.post('/emd/process', async (req, res) => {
  try {
    const { indent_number, emd_amount, emd_date, buyer_type, branch, zone, created_by } = req.body;
    if (!indent_number || !emd_amount || !emd_date) {
      return res.status(400).json({ error: 'indent_number, emd_amount, and emd_date are required' });
    }
    const { data, error } = await supabase
      .from('emd_table')
      .insert({
        indent_number,
        emd_amount,
        emd_date,
        buyer_type: buyer_type || null,
        branch: branch || null,
        zone: zone || null,
        created_by: created_by || 'system',
        created_at: new Date().toISOString(),
      })
      .select();
    if (error) throw error;
    await logAction(indent_number, 'EMD Processed', `Amount: ${emd_amount}`);
    res.status(201).json({ message: 'EMD processed', data: data[0] });
  } catch (error) {
    await logAction(indent_number || 'unknown', 'EMD Processing Error', error.message);
    res.status(500).json({ error: 'Failed to process EMD', message: error.message });
  }
});

// Check EMD date validity
router.post('/emd/check-date', async (req, res) => {
  try {
    const { emd_date } = req.body;
    if (!emd_date) {
      return res.status(400).json({ valid: false, error: 'emd_date is required' });
    }
    const today = new Date();
    const emdDate = new Date(emd_date);
    if (isNaN(emdDate.getTime())) {
      return res.status(400).json({ valid: false, error: 'Invalid date format' });
    }
    if (emdDate < today.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ valid: false, error: 'EMD date is in the past' });
    }
    res.json({ valid: true });
  } catch (error) {
    logger.error('Error checking EMD date:', error);
    await logAction(null, 'EMD Date Check Error', error.message);
    res.status(500).json({ valid: false, error: 'Failed to check EMD date', message: error.message });
  }
});

// Log errors to processing_logs table
router.post('/log-error', async (req, res) => {
  try {
    const { error_type, message, details, indent_number } = req.body;
    if (!error_type || !message) {
      return res.status(400).json({ error: 'error_type and message are required' });
    }
    const { data, error } = await supabase
      .from('processing_logs')
      .insert({
        error_type,
        message,
        details: details || null,
        indent_number: indent_number || null,
        created_at: new Date().toISOString(),
      })
      .select();
    if (error) throw error;
    res.status(201).json({ message: 'Error logged', data: data[0] });
  } catch (error) {
    logger.error('Error logging error:', error);
    await logAction(indent_number || 'unknown', 'Error Logging Error', error.message);
    res.status(500).json({ error: 'Failed to log error', message: error.message });
  }
});

// Log action to audit_logs
async function logAction(indent_number, action, details) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({ indent_number, action, details, created_at: new Date().toISOString() });
  if (error) logger.error(`Log error: ${error.message}`);
}

export default router;