const express = require('express');
const router = express.Router();
const { validateUserType } = require('../lib/tax-config');
const { listSubscriptions, addSubscription, deleteSubscription } = require('../store/subscriptions');

// GET /subscriptions?user_type=sme|individual
router.get('/', validateUserType, (req, res) => {
  const subs = listSubscriptions(req.userType);
  res.json({ subscriptions: subs, count: subs.length });
});

// POST /subscriptions
// Body: { user_type, merchant, amount, nextDueDate, frequency }
router.post('/', (req, res) => {
  const { user_type, merchant, amount, nextDueDate, frequency } = req.body;

  if (!user_type || !['sme', 'individual'].includes(user_type)) {
    return res.status(400).json({ error: 'user_type is required and must be "sme" or "individual"' });
  }
  if (!merchant || amount == null || !nextDueDate || !frequency) {
    return res.status(400).json({ error: 'merchant, amount, nextDueDate, and frequency are required' });
  }
  if (!['monthly', 'weekly'].includes(frequency)) {
    return res.status(400).json({ error: 'frequency must be "monthly" or "weekly"' });
  }

  const subscription = addSubscription(user_type, { merchant, amount: Number(amount), nextDueDate, frequency });
  res.status(201).json({ subscription });
});

// DELETE /subscriptions/:id?user_type=sme|individual
router.delete('/:id', validateUserType, (req, res) => {
  const deleted = deleteSubscription(req.userType, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  res.json({ message: 'Deleted', id: req.params.id });
});

module.exports = router;
