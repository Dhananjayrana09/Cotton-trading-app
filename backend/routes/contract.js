// PRODUCTION NOTE: All secrets must be loaded from .env and never hardcoded.
// TODO: Add input validation and JWT authentication for protected endpoints.
import express from 'express';
import axios from 'axios';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Search indent (queries allocation table directly)
router.post('/search-indent', async (req, res) => {
  const { indent_number } = req.body;
  
  if (!indent_number) {
    return res.status(400).json({ error: 'indent_number is required' });
  }

  try {
    const { data, error } = await supabase
      .from('allocation_table')
      .select('*')
      .eq('indent_number', indent_number)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'No procurement details found for this indent number' });
      }
      throw error;
    }

    // Map database fields to ProcurementDetails interface
    const procurementDetails = {
      id: data.id,
      indent_number: data.indent_number,
      buyer_type: data.buyer_type || 'Unknown',
      buyer_name: data.buyer_name || 'Unknown',
      firm_name: data.firm_name || 'Unknown',
      center_name: data.center_name || 'Unknown',
      branch: data.branch || 'Unknown',
      variety: data.variety || 'Unknown',
      bales_quantity: data.bales_quantity || 0,
      offer_price: data.offer_price || 0,
      bid_price: data.bid_price || 0,
      crop_year: data.crop_year || 'Unknown',
      lifting_period: data.lifting_period || 'Unknown',
      status: data.status || 'active',
      created_at: data.created_at
    };

    res.json(procurementDetails);
  } catch (error) {
    console.error('Error searching indent:', error);
    res.status(500).json({ error: 'Failed to search indent', message: error.message });
  }
});

// Upload contract (calls n8n webhook, handles file upload)
router.post('/upload', async (req, res) => {
  try {
    const { indent_number, firm_name } = req.body;
    const file = req.files?.file;
    if (!file || !indent_number || !firm_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('indent_number', indent_number);
    formData.append('firm_name', firm_name);
    const response = await axios.post(`${process.env.N8N_URL}/webhook/upload-contract`, formData, {
      headers: formData.getHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload contract', message: error.message });
  }
});

// Approve and send contract (calls n8n webhook)
router.post('/approve-send', async (req, res) => {
  const { indent_number } = req.body;
  try {
    const response = await axios.post(`${process.env.N8N_URL}/webhook/approve-send`, { indent_number });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve and send', message: error.message });
  }
});

// Fetch contract details by indent number
router.get('/:indent_number', async (req, res) => {
  try {
    const { indent_number } = req.params;
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('indent_number', indent_number)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract details', message: error.message });
  }
});

// Get all contracts pending approval
router.get('/pending-approvals', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('upload_status', 'pending_approval')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending approvals', message: error.message });
  }
});

export default router; 