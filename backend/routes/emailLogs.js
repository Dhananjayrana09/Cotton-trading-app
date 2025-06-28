import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Get all email logs with pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, sender_email } = req.query;
    
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('received_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Add filters
    if (status && status !== 'all') {
      query = query.eq('processing_status', status);
    }

    if (sender_email) {
      query = query.ilike('sender_email', `%${sender_email}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs', message: error.message });
  }
});

// Get email log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Email log not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching email log:', error);
    res.status(500).json({ error: 'Failed to fetch email log', message: error.message });
  }
});

// Create new email log
router.post('/', async (req, res) => {
  try {
    const emailLogData = req.body;
    const { data, error } = await supabase
      .from('email_logs')
      .insert([emailLogData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating email log:', error);
    res.status(500).json({ error: 'Failed to create email log', message: error.message });
  }
});

// Update email log
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { data, error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating email log:', error);
    res.status(500).json({ error: 'Failed to update email log', message: error.message });
  }
});

// Get email logs statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: totalEmails, error: totalError } = await supabase
      .from('email_logs')
      .select('processing_status', { count: 'exact' });

    if (totalError) throw totalError;

    const { data: statusCounts, error: statusError } = await supabase
      .from('email_logs')
      .select('processing_status')
      .in('processing_status', ['received', 'processed', 'pending_review', 'failed']);

    if (statusError) throw statusError;

    const stats = {
      total: totalEmails.length,
      received: statusCounts.filter(log => log.processing_status === 'received').length,
      processed: statusCounts.filter(log => log.processing_status === 'processed').length,
      pending_review: statusCounts.filter(log => log.processing_status === 'pending_review').length,
      failed: statusCounts.filter(log => log.processing_status === 'failed').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email stats', message: error.message });
  }
});

export default router; 