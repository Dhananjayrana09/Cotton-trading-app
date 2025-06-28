// PRODUCTION NOTE: All secrets must be loaded from .env and never hardcoded.
// TODO: Add input validation and JWT authentication for protected endpoints.
import express from 'express';
import supabase from '../supabaseClient.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Create customer order
router.post('/', async (req, res) => {
  try {
    const { indent_number, customer_name, bank_name, payment_method, amount, customer_email } = req.body;
    if (!['NEFT', 'RTGS', 'UPI'].includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    const { data, error } = await supabase
      .from('customer_orders')
      .insert({ indent_number, customer_name, bank_name, payment_method, amount, status: 'pending', created_at: new Date().toISOString(), customer_email })
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Order created', data: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
});

// Process payment
router.post('/process-payment', async (req, res) => {
  try {
    const { order_id, transaction_id, amount } = req.body;
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('amount')
      .eq('id', order_id)
      .single();
    if (orderError || order.amount !== amount) return res.status(400).json({ error: 'Invalid order or amount' });
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({ order_id, transaction_id, amount, status: 'processed', created_at: new Date().toISOString() })
      .select();
    if (error) return res.status(500).json({ error: error.message });
    await supabase
      .from('customer_orders')
      .update({ status: 'processed' })
      .eq('id', order_id);
    res.json({ message: 'Payment processed', data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment', message: error.message });
  }
});

// Generate invoice
router.post('/generate-invoice', async (req, res) => {
  try {
    const { order_id } = req.body;
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', order_id)
      .single();
    if (orderError) return res.status(404).json({ error: 'Order not found' });
    const invoiceNumber = `INV-${Date.now()}`;
    const pdfBuffer = Buffer.from(`Invoice ${invoiceNumber} for ${order.customer_name}\nAmount: ${order.amount}`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('invoices')
      .upload(`${invoiceNumber}.pdf`, pdfBuffer, { contentType: 'application/pdf' });
    if (uploadError) return res.status(500).json({ error: uploadError.message });
    const fileUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/invoices/${uploadData.path}`;
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({ order_id, invoice_number: invoiceNumber, pdf_url: fileUrl, status: 'generated', created_at: new Date().toISOString() })
      .select();
    if (invoiceError) return res.status(500).json({ error: invoiceError.message });
    res.json({ message: 'Invoice generated', data: invoice[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

// Send confirmation email
router.post('/send-confirmation', async (req, res) => {
  try {
    const { order_id } = req.body;
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('invoice_number, pdf_url')
      .eq('order_id', order_id)
      .single();
    if (invoiceError) return res.status(404).json({ error: 'Invoice not found' });
    // Fetch customer email from order (replace with actual field if available)
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('customer_email')
      .eq('id', order_id)
      .single();
    if (orderError) return res.status(404).json({ error: 'Order not found' });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.customer_email,
      subject: `Payment Confirmation - Invoice ${invoice.invoice_number}`,
      text: `Your payment has been processed. Invoice attached.`,
      attachments: [{ filename: 'invoice.pdf', path: invoice.pdf_url }],
    };
    await transporter.sendMail(mailOptions);
    await supabase
      .from('audit_log')
      .insert({ action: 'Payment confirmation email sent', order_id, timestamp: new Date().toISOString() });
    res.json({ message: 'Confirmation email sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send confirmation', message: error.message });
  }
});

// Fetch order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', message: error.message });
  }
});

// Fetch invoice details
router.get('/invoice/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', order_id)
      .single();
    if (error) return res.status(404).json({ error: 'Invoice not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice', message: error.message });
  }
});

export default router; 