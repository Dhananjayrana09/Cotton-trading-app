import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Search allocation by indent number
router.get('/allocation/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    if (!indentNumber) {
      return res.status(400).json({ error: 'Indent number is required' });
    }

    const { data, error } = await supabase
      .from('allocation_table') 
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Allocation not found' });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ error: 'Failed to fetch allocation', message: error.message });
  }
});

// Calculate sampling defaults
router.post('/calculate-sampling', async (req, res) => {
  try {
    const { bales_quantity } = req.body;

    if (!bales_quantity || bales_quantity <= 0) {
      return res.status(400).json({ error: 'Valid bales quantity is required' });
    }

    const base = Math.floor(bales_quantity / 100);
    let extra = Math.floor(base * 0.2);
    
    if (extra < 1) {
      extra = 0;
    }
    
    const total = base + extra;

    const calculation = {
      base,
      extra,
      total,
      bales_quantity
    };

    res.json(calculation);

  } catch (error) {
    console.error('Error calculating sampling:', error);
    res.status(500).json({ error: 'Failed to calculate sampling', message: error.message });
  }
});

// Calculate lots (frontend endpoint)
router.post('/calculate-lots', async (req, res) => {
  try {
    const { indent_number, bales_quantity } = req.body;

    if (!bales_quantity || bales_quantity <= 0) {
      return res.status(400).json({ error: 'Valid bales quantity is required' });
    }

    const base = Math.floor(bales_quantity / 100);
    let extra = Math.floor(base * 0.2);
    
    if (extra < 1) {
      extra = 0;
    }
    
    const total = base + extra;

    const calculation = {
      base,
      extra,
      total
    };

    res.json(calculation);

  } catch (error) {
    console.error('Error calculating lots:', error);
    res.status(500).json({ error: 'Failed to calculate lots', message: error.message });
  }
});

// Get inventory entries by indent number
router.get('/inventory/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    const { data, error } = await supabase
      .from('inventory_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory', message: error.message });
  }
});

// Get sampling audit logs
router.get('/audit-logs/:indentNumber?', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'Sampling Entry')
      .order('created_at', { ascending: false });

    if (indentNumber) {
      query = query.eq('indent_number', indentNumber);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// Save inventory lots
router.post('/save-inventory', async (req, res) => {
  try {
    const inventoryData = req.body;

    if (!inventoryData || !Array.isArray(inventoryData)) {
      return res.status(400).json({ error: 'Invalid inventory data' });
    }

    const { data, error } = await supabase
      .from('inventory_table')
      .insert(inventoryData)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Successfully saved ${data.length} inventory entries`,
      data
    });

  } catch (error) {
    console.error('Error saving inventory:', error);
    res.status(500).json({ error: 'Failed to save inventory', message: error.message });
  }
});

// Log sampling entry
router.post('/log', async (req, res) => {
  try {
    const { indent_number } = req.body;

    if (!indent_number) {
      return res.status(400).json({ error: 'Indent number is required' });
    }

    const auditLogData = {
      indent_number,
      action: 'Sampling Entry',
      performed_by: 'system',
      details: {
        timestamp: new Date().toISOString(),
        action_type: 'sampling_entry'
      }
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditLogData)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Sampling entry logged successfully',
      data
    });

  } catch (error) {
    console.error('Error logging sampling entry:', error);
    res.status(500).json({ error: 'Failed to log sampling entry', message: error.message });
  }
});

// Validate lot numbers (called by n8n webhook)
router.post('/validate-lots', async (req, res) => {
  try {
    const { indent_number, lot_numbers, allocation_data } = req.body;

    if (!indent_number || !lot_numbers || !Array.isArray(lot_numbers)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const errors = [];
    const validatedLots = [];

    // Check for empty lot numbers
    const emptyLots = lot_numbers.filter(lot => !lot || lot.trim() === '');
    if (emptyLots.length > 0) {
      errors.push('All lot numbers must be provided');
    }

    // Check for duplicate lot numbers
    const duplicates = lot_numbers.filter((lot, index) => lot_numbers.indexOf(lot) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate lot numbers found: ${duplicates.join(', ')}`);
    }

    // Check if lot numbers already exist in inventory
    if (lot_numbers.length > 0) {
      const { data: existingLots, error: checkError } = await supabase
        .from('inventory_table')
        .select('lot_number')
        .in('lot_number', lot_numbers);

      if (checkError) throw checkError;

      if (existingLots && existingLots.length > 0) {
        const existingLotNumbers = existingLots.map(lot => lot.lot_number);
        errors.push(`Lot numbers already exist in inventory: ${existingLotNumbers.join(', ')}`);
      }
    }

    // If no errors, mark all lots as valid
    if (errors.length === 0) {
      lot_numbers.forEach(lot => {
        validatedLots.push({
          lot_number: lot,
          is_valid: true
        });
      });
    }

    res.json({
      isValid: errors.length === 0,
      errors,
      validatedLots
    });

  } catch (error) {
    console.error('Error validating lots:', error);
    res.status(500).json({ error: 'Validation failed', message: error.message });
  }
});

// Submit sampling data (called by n8n webhook)
router.post('/submit-sampling', async (req, res) => {
  try {
    const { 
      indent_number, 
      lot_numbers, 
      allocation_data, 
      calculation_details, 
      performed_by 
    } = req.body;

    if (!indent_number || !lot_numbers || !allocation_data) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Prepare inventory entries
    const inventoryEntries = lot_numbers.map(lot_number => ({
      indent_number,
      lot_number,
      quantity_bales: Math.floor(allocation_data.bales_quantity / lot_numbers.length), // Distribute bales
      status: 'available'
    }));

    // Insert into inventory table
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_table')
      .insert(inventoryEntries)
      .select();

    if (inventoryError) throw inventoryError;

    // Create audit log
    const auditLogData = {
      indent_number,
      action: 'Sampling Entry',
      performed_by: performed_by || 'system',
      details: {
        lot_numbers,
        allocation_data,
        calculation_details,
        inventory_entries_created: inventoryData.length
      }
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogData);

    if (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the request if audit log fails
    }

    res.json({
      success: true,
      message: `Successfully created ${inventoryData.length} inventory entries for sampling`,
      inventory_entries: inventoryData
    });

  } catch (error) {
    console.error('Error submitting sampling data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit sampling data', 
      error: error.message 
    });
  }
});

export default router; 