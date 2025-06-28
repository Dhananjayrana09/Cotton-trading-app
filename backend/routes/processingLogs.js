import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Get processing logs with optional email log ID filter
router.get('/', async (req, res) => {
  try {
    const { limit = 100, emailLogId, processing_stage, status } = req.query;
    
    let query = supabase
      .from('processing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Add filters
    if (emailLogId) {
      query = query.eq('email_log_id', emailLogId);
    }

    if (processing_stage) {
      query = query.eq('processing_stage', processing_stage);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching processing logs:', error);
    res.status(500).json({ error: 'Failed to fetch processing logs', message: error.message });
  }
});

// Get processing log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('processing_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Processing log not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching processing log:', error);
    res.status(500).json({ error: 'Failed to fetch processing log', message: error.message });
  }
});

// Create new processing log
router.post('/', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to create processing log', message: error.message });
  }
});

// Get processing logs for a specific email log
router.get('/email/:emailLogId', async (req, res) => {
  try {
    const { emailLogId } = req.params;
    const { data, error } = await supabase
      .from('processing_logs')
      .select('*')
      .eq('email_log_id', emailLogId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching processing logs for email:', error);
    res.status(500).json({ error: 'Failed to fetch processing logs', message: error.message });
  }
});

export default router; 