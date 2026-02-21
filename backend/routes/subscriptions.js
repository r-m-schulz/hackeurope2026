const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const { requireAuth } = require('../lib/auth-middleware');

function toFrontendShape(s) {
  return {
    id: s.id,
    merchant: s.merchant,
    amount: Number(s.amount),
    nextDueDate: s.next_due_date,
    frequency: s.frequency,
  };
}

// All subscription routes require auth
router.use(requireAuth);

// GET /subscriptions
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const subscriptions = data.map(toFrontendShape);
  res.json({ subscriptions, count: subscriptions.length });
});

// POST /subscriptions
router.post('/', async (req, res) => {
  const { merchant, amount, nextDueDate, frequency } = req.body;

  if (!merchant || amount == null || !nextDueDate || !frequency) {
    return res.status(400).json({ error: 'merchant, amount, nextDueDate, and frequency are required' });
  }
  if (!['monthly', 'weekly'].includes(frequency)) {
    return res.status(400).json({ error: 'frequency must be "monthly" or "weekly"' });
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: req.userId,
      merchant,
      amount: Number(amount),
      next_due_date: nextDueDate,
      frequency,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ subscription: toFrontendShape(data) });
});

// DELETE /subscriptions/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Deleted', id: req.params.id });
});

module.exports = router;
