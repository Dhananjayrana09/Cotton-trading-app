import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validate order endpoint - calls n8n workflow
router.post('/validate', async (req, res) => {
  try {
    const orderData = req.body;

    // Validate required fields
    const requiredFields = [
      'indent_number', 'buyer_type', 'bales_quantity', 'center_name', 
      'branch', 'date', 'lifting_period', 'fibre_length', 'variety', 'bid_price'
    ];

    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        isValid: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        step: 'input_validation'
      });
    }

    // Call n8n workflow for validation and quantity check
    const n8nResponse = await fetch(`${process.env.N8N_WEBHOOK_URL}/validate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        session_id: `order_${Date.now()}`
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n workflow failed: ${n8nResponse.statusText}`);
    }

    const validationResult = await n8nResponse.json();
    res.json(validationResult);

  } catch (error) {
    console.error('Order validation error:', error);
    res.status(500).json({
      isValid: false,
      message: 'Order validation failed due to server error',
      step: 'server_error',
      error: error.message
    });
  }
});

// Get allocation details by indent number
router.get('/allocation/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    const { data, error } = await supabase
      .from('allocation_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Allocation not found',
          message: 'No allocation found for the given indent number'
        });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch allocation', 
      message: error.message 
    });
  }
});

// Create customer order
router.post('/create', async (req, res) => {
  try {
    const orderData = req.body;

    // First validate the order
    const validationResponse = await fetch(`${process.env.N8N_WEBHOOK_URL}/validate-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const validationResult = await validationResponse.json();

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        validationResult
      });
    }

    // Create order record in customer_orders table
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .insert([{
        indent_number: orderData.indent_number,
        buyer_type: orderData.buyer_type,
        bales_quantity: orderData.bales_quantity,
        center_name: orderData.center_name,
        branch: orderData.branch,
        order_date: orderData.date,
        lifting_period: orderData.lifting_period,
        fibre_length: orderData.fibre_length,
        variety: orderData.variety,
        bid_price: orderData.bid_price,
        order_status: 'validated',
        total_amount: orderData.bales_quantity * orderData.bid_price,
        created_by: orderData.created_by || 'customer'
      }])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Log the order creation
    await supabase
      .from('processing_logs')
      .insert([{
        email_log_id: `order_${order.id}`,
        processing_stage: 'order_creation',
        status: 'success',
        message: 'Customer order created successfully',
        details: {
          order_id: order.id,
          indent_number: orderData.indent_number,
          bales_quantity: orderData.bales_quantity,
          total_amount: order.total_amount
        }
      }]);

    res.json({
      success: true,
      message: 'Order created successfully',
      order: order,
      validationResult: validationResult
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get customer orders
router.get('/list', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('order_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orders', 
      message: error.message 
    });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const { data, error } = await supabase
      .from('customer_orders')
      .update({ 
        order_status: status,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Log the status update
    await supabase
      .from('processing_logs')
      .insert([{
        email_log_id: `order_${orderId}`,
        processing_stage: 'status_update',
        status: 'success',
        message: `Order status updated to ${status}`,
        details: {
          order_id: orderId,
          new_status: status,
          notes: notes
        }
      }]);

    res.json(data);

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Failed to update order status', 
      message: error.message 
    });
  }
});

export default router;