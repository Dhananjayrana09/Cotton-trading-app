import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get available lots for an indent number
router.get('/lots/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    const { data, error } = await supabase
      .from('inventory_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .eq('status', 'Available')
      .order('lot_number');

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching available lots:', error);
    res.status(500).json({ error: 'Failed to fetch available lots', message: error.message });
  }
});

// Create sales order
router.post('/orders', async (req, res) => {
  try {
    const orderData = req.body;

    // Calculate total amount
    const totalAmount = (orderData.bales_quantity || 0) * (orderData.bid_price || 0);

    // Create sales order
    const { data: salesOrder, error: salesError } = await supabase
      .from('sales_table')
      .insert([{
        ...orderData,
        total_amount: totalAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (salesError) throw salesError;

    // Create lot allocations if lots are specified
    if (orderData.allocated_lots && Array.isArray(orderData.allocated_lots)) {
      const lotAllocations = orderData.allocated_lots.map(lotNumber => ({
        sales_id: salesOrder.id,
        lot_number: lotNumber,
        indent_number: orderData.indent_number,
        allocated_quantity: Math.floor((orderData.bales_quantity || 0) / orderData.allocated_lots.length),
        status: 'allocated'
      }));

      const { error: allocationError } = await supabase
        .from('lot_allocations')
        .insert(lotAllocations);

      if (allocationError) {
        console.error('Error creating lot allocations:', allocationError);
        // Don't fail the request, just log the error
      }
    }

    // Log the action
    await supabase
      .from('audit_logs')
      .insert([{
        action: 'Sales Order Created',
        entity_id: salesOrder.id,
        entity_type: 'sales_order',
        user_id: 'system', // In production, this would be the actual user ID
        details: {
          indent_number: orderData.indent_number,
          total_amount: totalAmount,
          allocated_lots: orderData.allocated_lots
        },
        indent_number: orderData.indent_number,
        status: 'pending'
      }]);

    res.json({
      success: true,
      message: 'Sales order created successfully',
      data: salesOrder
    });

  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
});

// Get sales orders
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('sales_table')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ error: 'Failed to fetch sales orders', message: error.message });
  }
});

// Get pending sales orders for admin review
router.get('/orders/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales_table')
      .select('*')
      .in('status', ['pending', 'admin_review'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching pending sales orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending sales orders', message: error.message });
  }
});

// Update sales order status
router.patch('/orders/:salesId/status', async (req, res) => {
  try {
    const { salesId } = req.params;
    const { status, admin_notes } = req.body;

    const updateData = {
      status,
      admin_notes,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.confirmed_by = 'admin'; // In production, this would be the actual admin user ID
    }

    const { data, error } = await supabase
      .from('sales_table')
      .update(updateData)
      .eq('id', salesId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error updating sales order status:', error);
    res.status(500).json({ error: 'Failed to update sales order status', message: error.message });
  }
});

// Get customers
router.get('/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customer_jobs')
      .select('*')
      .eq('status', 'active')
      .order('customer_name');

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers', message: error.message });
  }
});

// Get brokers
router.get('/brokers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broker_jobs')
      .select('*')
      .eq('status', 'active')
      .order('broker_name');

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers', message: error.message });
  }
});

// Generate draft contract (placeholder)
router.post('/contracts/generate-draft', async (req, res) => {
  try {
    const { sales_order, contract_type, allocated_lots } = req.body;

    // In production, this would generate an actual PDF
    // For now, we'll return a mock response
    const contractData = {
      contract_id: `DRAFT_${sales_order.id}_${Date.now()}`,
      pdf_data: 'base64_encoded_pdf_data_here', // Mock PDF data
      contract_url: `https://s3.amazonaws.com/contracts/draft/${sales_order.indent_number}_draft_contract.pdf`,
      generated_at: new Date().toISOString()
    };

    res.json(contractData);

  } catch (error) {
    console.error('Error generating draft contract:', error);
    res.status(500).json({ error: 'Failed to generate draft contract', message: error.message });
  }
});

// Generate final contract (placeholder)
router.post('/contracts/generate-final', async (req, res) => {
  try {
    const { sales_order, contract_type, commission_details } = req.body;

    // In production, this would generate an actual PDF
    // For now, we'll return a mock response
    const contractData = {
      contract_id: `FINAL_${sales_order.id}_${Date.now()}`,
      contract_url: `https://s3.amazonaws.com/contracts/final/${sales_order.indent_number}_final_contract.pdf`,
      generated_at: new Date().toISOString()
    };

    res.json(contractData);

  } catch (error) {
    console.error('Error generating final contract:', error);
    res.status(500).json({ error: 'Failed to generate final contract', message: error.message });
  }
});

export default router;