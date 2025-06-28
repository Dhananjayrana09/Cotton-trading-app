// PRODUCTION NOTE: All secrets must be loaded from .env and never hardcoded.
// TODO: Add input validation and JWT authentication for protected endpoints.
import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();


// Fetch allocation details by indent number
router.get('/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const { data, error } = await supabase
      .from('allocation_table')
      .select('*')
      .eq('indent_number', indent_number)
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

// Log allocation action
router.post('/log', async (req, res) => {
  try {
    const { indent_number, action, details } = req.body;
    if (!indent_number || !action) {
      return res.status(400).json({ error: 'indent_number and action are required' });
    }
    const { data, error } = await supabase
      .from('allocation_logs')
      .insert({
        indent_number,
        action,
        details: details || null,
        created_at: new Date().toISOString(),
      })
      .select();
    if (error) throw error;
    res.json({ message: 'Log created', data });
  } catch (error) {
    console.error('Error logging allocation:', error);
    res.status(500).json({ error: 'Failed to log allocation', message: error.message });
  }
});

// Update allocation status/details
router.patch('/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const updateFields = req.body;
    // Allow updating payment and cost details if present
    const allowedFields = [
      'cgst_percentage', 'sgst_percentage', 'cgst_amount', 'sgst_amount', 'gst_amount', 'total_amount',
      'payment_status', 'payment_date', 'utr_number', 'updated_by', 'updated_at',
      // add other fields as needed
    ];
    const filteredFields = Object.keys(updateFields)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateFields[key];
        return obj;
      }, {});
    if (!filteredFields || Object.keys(filteredFields).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }
    filteredFields.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('allocation_table')
      .update(filteredFields)
      .eq('indent_number', indent_number)
      .select()
      .single();
    if (error) throw error;
    res.json({ message: 'Allocation updated', data });
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation', message: error.message });
  }
});

// Fetch all allocations
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('allocation_table')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching all allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations', message: error.message });
  }
});

// Search allocations
router.get('/search', async (req, res) => {
  try {
    const { searchTerm, buyer_type, status, crop_year } = req.query;
    
    let query = supabase
      .from('allocation_table')
      .select('*')
      .order('created_at', { ascending: false });

    // Add search term filter
    if (searchTerm) {
      query = query.or(`indent_number.ilike.%${searchTerm}%,buyer_name.ilike.%${searchTerm}%,firm_name.ilike.%${searchTerm}%`);
    }

    // Add filters
    if (buyer_type) {
      query = query.eq('buyer_type', buyer_type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (crop_year) {
      query = query.eq('crop_year', crop_year);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error searching allocations:', error);
    res.status(500).json({ error: 'Failed to search allocations', message: error.message });
  }
});

// Add new allocation (manual entry)
router.post('/', async (req, res) => {
  try {
    const newData = req.body;
    // You may want to validate newData here
    const { data, error } = await supabase
      .from('allocation_table')
      .insert([newData])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to create allocation', message: error.message });
  }
});

// Fetch testing confirmation details by indent number
router.get('/testing-confirmation/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const { data, error } = await supabase
      .from('branch_info')
      .select('Branch, Zone, Candy_rate, mail')
      .eq('indent_number', indent_number)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Testing confirmation not found' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching testing confirmation:', error);
    res.status(500).json({ error: 'Failed to fetch testing confirmation', message: error.message });
  }
});

export default router; 