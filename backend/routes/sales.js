// PRODUCTION NOTE: All secrets must be loaded from .env and never hardcoded.
// TODO: Add input validation and JWT authentication for protected endpoints.
import express from 'express';
import axios from 'axios';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Fetch pending sales orders (calls n8n webhook if needed)
router.get('/', async (req, res) => {
  try {
    // Optionally, call n8n webhook for automation
    // const response = await axios.get(`${process.env.N8N_URL}/webhook/sales`);
    // return res.json(response.data);
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales', message: error.message });
  }
});

// Confirm a sale (calls n8n webhook for automation)
router.post('/confirm', async (req, res) => {
  try {
    const { sale_id, indent_number, quantity, customer_email } = req.body;
    // Optionally, call n8n webhook for automation
    // const response = await axios.post(`${process.env.N8N_URL}/webhook/confirm-sale`, { sale_id, indent_number, quantity, customer_email });
    // return res.json(response.data);
    // Update sales status
    const { data: sale, error: saleError } = await supabase
      .from('sales_table')
      .update({ status: 'confirmed' })
      .eq('id', sale_id)
      .select()
      .single();
    if (saleError) throw saleError;
    // Update inventory (simplified: mark lots as sold)
    await supabase
      .from('inventory_table')
      .update({ status: 'sold' })
      .eq('indent_number', indent_number)
      .limit(quantity);
    // Generate sales contract (stub, to be expanded)
    const contractNumber = `SC-${Date.now()}`;
    const pdfBuffer = Buffer.from(`Sales Contract ${contractNumber} for Indent ${indent_number}\nQuantity: ${quantity}`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('sales_contracts')
      .upload(`${contractNumber}.pdf`, pdfBuffer, { contentType: 'application/pdf' });
    if (uploadError) throw uploadError;
    const fileUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/sales_contracts/${uploadData.path}`;
    const { data: contract, error: contractError } = await supabase
      .from('sales_contracts')
      .insert({ sale_id, contract_number: contractNumber, pdf_url: fileUrl, status: 'generated', created_at: new Date().toISOString() })
      .select();
    if (contractError) throw contractError;
    // Send confirmation email (stub, to be expanded)
    // ...
    // Log action
    await supabase
      .from('audit_log')
      .insert({ action: 'Sales confirmation email sent', sale_id, timestamp: new Date().toISOString() });
    res.json({ message: 'Sale confirmed and contract generated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm sale', message: error.message });
  }
});

// Get customers
router.get('/customers', async (req, res) => {
  try {
    console.log('Fetching customers from customer_info table...');
    const { data, error } = await supabase
      .from('customer_info')
      .select('*');
    
    console.log('Customer query result:', { data, error });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers', message: error.message });
  }
});

// Get customer by ID
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('customer_info')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Customer not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer', message: error.message });
  }
});

// Get brokers
router.get('/brokers', async (req, res) => {
  try {
    console.log('Fetching brokers from broker_info table...');
    const { data, error } = await supabase
      .from('broker_info')
      .select('*');
    
    console.log('Broker query result:', { data, error });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers', message: error.message });
  }
});

// Get broker by ID
router.get('/brokers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Broker not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broker', message: error.message });
  }
});

// Get available lots for an indent number
router.get('/available-lots/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;
    const { data, error } = await supabase
      .from('inventory_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .eq('status', 'available')
      .order('lot_number', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available lots', message: error.message });
  }
});

// Block lots for a sales order
router.post('/block-lots', async (req, res) => {
  try {
    const { lotNumbers, salesId } = req.body;
    
    const { error } = await supabase
      .from('inventory_table')
      .update({ 
        status: 'blocked',
        sales_id: salesId,
        updated_at: new Date().toISOString()
      })
      .in('lot_number', lotNumbers);
    
    if (error) throw error;
    res.json({ message: 'Lots blocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block lots', message: error.message });
  }
});

// Get lot allocations for a sales order
router.get('/lot-allocations/:salesId', async (req, res) => {
  try {
    const { salesId } = req.params;
    const { data, error } = await supabase
      .from('inventory_table')
      .select('*')
      .eq('sales_id', salesId)
      .order('lot_number', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lot allocations', message: error.message });
  }
});

// Search sales orders
router.get('/search', async (req, res) => {
  try {
    const { searchTerm, status, buyer_type, date_from, date_to } = req.query;
    
    let query = supabase
      .from('sales_table')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`indent_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (buyer_type) {
      query = query.eq('buyer_type', buyer_type);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search sales orders', message: error.message });
  }
});

// Get pending sales orders
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending sales orders', message: error.message });
  }
});

// Fetch sales contract details
router.get('/contracts/:sale_id', async (req, res) => {
  try {
    const { sale_id } = req.params;
    const { data, error } = await supabase
      .from('sales_contracts')
      .select('*')
      .eq('sale_id', sale_id)
      .single();
    if (error) return res.status(404).json({ error: 'Contract not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract', message: error.message });
  }
});

// Fetch sales order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Sale not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sale', message: error.message });
  }
});

// Update sales order status
router.patch('/:salesId/status', async (req, res) => {
  try {
    const { salesId } = req.params;
    const { status, notes } = req.body;
    
    const { data, error } = await supabase
      .from('sales_table')
      .update({ 
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', salesId)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sales order status', message: error.message });
  }
});

export default router; 