import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cost calculation endpoint
router.post('/calculate-costs', async (req, res) => {
  try {
    const { indent_number } = req.body;

    if (!indent_number) {
      return res.status(400).json({ error: 'Indent number is required' });
    }

    // Fetch allocation data
    const { data: allocation, error: allocationError } = await supabase
      .from('allocation_table')
      .select('*')
      .eq('indent_number', indent_number)
      .single();

    if (allocationError || !allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Fetch tax rates for the zone
    const { data: taxRates, error: taxError } = await supabase
      .from('zone_tax_rates')
      .select('*')
      .eq('zone', allocation.branch || 'Default')
      .single();

    if (taxError) {
      // Use default rates if zone not found
      const defaultRates = {
        zone: 'Default',
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        additional_tax: 0
      };
      
      const calculation = calculateCosts(allocation, defaultRates);
      return res.json(calculation);
    }

    const calculation = calculateCosts(allocation, taxRates);
    
    // Save calculation to database
    const { data: savedCalculation, error: saveError } = await supabase
      .from('cost_calculations')
      .insert([calculation])
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    res.json(savedCalculation);

  } catch (error) {
    console.error('Cost calculation error:', error);
    res.status(500).json({ error: 'Cost calculation failed', message: error.message });
  }
});

// Payment initiation endpoint
router.post('/initiate-payment', async (req, res) => {
  try {
    const { indent_number, payment_method = 'bank_transfer' } = req.body;

    if (!indent_number) {
      return res.status(400).json({ error: 'Indent number is required' });
    }

    // Get cost calculation
    const { data: calculation, error: calcError } = await supabase
      .from('cost_calculations')
      .select('*')
      .eq('indent_number', indent_number)
      .single();

    if (calcError || !calculation) {
      return res.status(404).json({ error: 'Cost calculation not found' });
    }

    // Generate payment ID
    const paymentId = `PAY_${indent_number}_${Date.now()}`;

    // Create payment record
    const paymentData = {
      payment_id: paymentId,
      allocation_id: calculation.allocation_id,
      indent_number: indent_number,
      amount: calculation.total_amount,
      payment_method: payment_method,
      payment_status: 'pending'
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Create EMD record
    const emdData = {
      allocation_id: calculation.allocation_id,
      indent_number: indent_number,
      emd_amount: calculation.total_amount * 0.1, // 10% EMD
      emd_percentage: 10,
      emd_status: 'pending'
    };

    await supabase
      .from('emd_details')
      .insert([emdData]);

    // In production, integrate with actual payment gateway
    // For now, simulate payment gateway response
    const gatewayResponse = {
      payment_url: `https://payment-gateway.example.com/pay/${paymentId}`,
      status: 'initiated',
      gateway_payment_id: `GW_${paymentId}`
    };

    // Update payment with gateway response
    await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'initiated',
        gateway_response: gatewayResponse
      })
      .eq('payment_id', paymentId);

    res.json({
      success: true,
      payment_id: paymentId,
      amount: calculation.total_amount,
      payment_url: gatewayResponse.payment_url,
      status: 'initiated'
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Payment initiation failed', message: error.message });
  }
});

// Payment callback endpoint (for payment gateway webhooks)
router.post('/payment/callback', async (req, res) => {
  try {
    const { payment_id, status, utr_number, failure_reason } = req.body;

    if (!payment_id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const updateData = {
      payment_status: status,
      payment_date: new Date().toISOString(),
      gateway_response: req.body
    };

    if (status === 'completed' && utr_number) {
      updateData.utr_number = utr_number;
    }

    if (status === 'failed' && failure_reason) {
      updateData.failure_reason = failure_reason;
    }

    // Update payment transaction
    const { data: payment, error: updateError } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('payment_id', payment_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (status === 'completed') {
      // Update allocation status
      await supabase
        .from('allocation_table')
        .update({ status: 'Payment Completed' })
        .eq('indent_number', payment.indent_number);

      // Update EMD status
      await supabase
        .from('emd_details')
        .update({ emd_status: 'received' })
        .eq('indent_number', payment.indent_number);
    }

    if (status === 'failed') {
      // Create payment reminder
      await supabase
        .from('payment_reminders')
        .insert([{
          payment_id: payment_id,
          indent_number: payment.indent_number,
          reminder_type: 'payment_failed',
          next_reminder_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }]);
    }

    res.json({ success: true, message: 'Payment status updated' });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Payment callback processing failed', message: error.message });
  }
});

// Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    // Get payment counts by status
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('payment_status, amount');

    const stats = {
      total_payments: payments?.length || 0,
      completed_payments: payments?.filter(p => p.payment_status === 'completed').length || 0,
      pending_payments: payments?.filter(p => ['pending', 'initiated'].includes(p.payment_status)).length || 0,
      failed_payments: payments?.filter(p => p.payment_status === 'failed').length || 0,
      total_amount: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      completed_amount: payments?.filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      pending_amount: payments?.filter(p => ['pending', 'initiated'].includes(p.payment_status))
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics', message: error.message });
  }
});

// Helper function to calculate costs
function calculateCosts(allocation, taxRates) {
  const baseAmount = (allocation.bales_quantity || 0) * (allocation.bid_price || 0);
  
  // Determine if inter-state transaction
  const isInterState = allocation.buyer_zone !== allocation.branch;
  
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  
  if (isInterState) {
    igstAmount = (baseAmount * taxRates.igst_rate) / 100;
  } else {
    cgstAmount = (baseAmount * taxRates.cgst_rate) / 100;
    sgstAmount = (baseAmount * taxRates.sgst_rate) / 100;
  }
  
  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
  const additionalCharges = (baseAmount * (taxRates.additional_tax || 0)) / 100;
  const totalAmount = baseAmount + totalTaxAmount + additionalCharges;
  
  return {
    allocation_id: allocation.id,
    indent_number: allocation.indent_number,
    base_amount: baseAmount,
    gst_rate: isInterState ? taxRates.igst_rate : (taxRates.cgst_rate + taxRates.sgst_rate),
    cgst_rate: taxRates.cgst_rate,
    sgst_rate: taxRates.sgst_rate,
    igst_rate: taxRates.igst_rate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    gst_amount: totalTaxAmount,
    additional_charges: additionalCharges,
    total_amount: totalAmount,
    zone: allocation.branch || 'Default',
    is_inter_state: isInterState,
    calculation_status: 'calculated'
  };
}

export default router;