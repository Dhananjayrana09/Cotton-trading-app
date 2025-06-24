import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Search procurement details by indent number
router.get('/procurement/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    if (!indentNumber) {
      return res.status(400).json({ error: 'Indent number is required' });
    }

    const { data, error } = await supabase
      .from('procurement_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Procurement details not found' });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching procurement details:', error);
    res.status(500).json({ error: 'Failed to fetch procurement details', message: error.message });
  }
});

// Get purchase contracts
router.get('/contracts', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('purchase_contract_table')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('upload_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts', message: error.message });
  }
});

// Get contract by indent number
router.get('/contracts/indent/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('indent_number', indentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Contract not found' });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract', message: error.message });
  }
});

// Update contract status (for admin approval/rejection)
router.patch('/contracts/:contractId/status', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { status, admin_notes, approved_by } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updateData = {
      upload_status: status,
      admin_notes: admin_notes
    };

    if (status === 'approved' && approved_by) {
      updateData.approved_by = approved_by;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('purchase_contract_table')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ error: 'Failed to update contract status', message: error.message });
  }
});

// Get branch information by branch name
router.get('/branch/:branchName', async (req, res) => {
  try {
    const { branchName } = req.params;

    const { data, error } = await supabase
      .from('branch_information')
      .select('*')
      .eq('branch_name', branchName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Branch information not found' });
      }
      throw error;
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching branch information:', error);
    res.status(500).json({ error: 'Failed to fetch branch information', message: error.message });
  }
});

// Create audit log entry
router.post('/audit-log', async (req, res) => {
  try {
    const { indent_number, action, performed_by, details } = req.body;

    if (!indent_number || !action || !performed_by) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const logData = {
      indent_number,
      action,
      performed_by,
      details: details || {},
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('contract_audit_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log', message: error.message });
  }
});

// Get audit logs for an indent number
router.get('/audit-logs/:indentNumber', async (req, res) => {
  try {
    const { indentNumber } = req.params;

    const { data, error } = await supabase
      .from('contract_audit_logs')
      .select('*')
      .eq('indent_number', indentNumber)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// Get contracts pending approval
router.get('/contracts/pending-approval', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchase_contract_table')
      .select('*')
      .eq('upload_status', 'pending_approval')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals', message: error.message });
  }
});

export default router;