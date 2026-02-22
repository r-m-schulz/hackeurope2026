const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const supabaseAdmin = require('../supabaseAdmin');
const { requireAuth } = require('../lib/auth-middleware');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRICE_ID = process.env.STRIPE_PRICE_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Allowed origins for return URL (so we redirect back to the app the user came from)
function getAllowedReturnOrigin(incoming) {
  if (!incoming || typeof incoming !== 'string') return null;
  const origin = incoming.replace(/\/$/, '');
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.replace(/\/$/, '')) return origin;
  return null;
}

// POST /stripe/create-checkout-session
// Body may include return_base_url (origin where the user started, e.g. https://yourapp.vercel.app)
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const userId = req.userId;
  const returnOrigin = getAllowedReturnOrigin(req.body?.return_base_url);
  const baseUrl = returnOrigin || FRONTEND_URL.replace(/\/$/, '');

  // Get user's email + existing stripe_customer_id from user_profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('stripe_customer_id, subscription_status')
    .eq('user_id', userId)
    .single();

  if (profileError) return res.status(500).json({ error: 'Could not load user profile' });

  // Already subscribed?
  if (profile?.subscription_status === 'active') {
    return res.status(400).json({ error: 'Already subscribed' });
  }

  let customerId = profile?.stripe_customer_id;

  // Create Stripe customer if we don't have one yet
  if (!customerId) {
    // Get user email from Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError) return res.status(500).json({ error: 'Could not load user' });

    const customer = await stripe.customers.create({
      email: authData.user.email,
      metadata: { user_id: userId },
    });
    customerId = customer.id;

    // Save customer ID
    await supabaseAdmin
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/subscribe`,
    metadata: { user_id: userId },
  });

  res.json({ url: session.url });
});

// GET /stripe/subscription-status
router.get('/subscription-status', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('subscription_status')
    .eq('user_id', req.userId)
    .single();

  if (error) return res.status(500).json({ error: 'Could not load subscription status' });

  const status = profile?.subscription_status ?? 'free';
  res.json({ isPro: status === 'active', status });
});

// POST /stripe/webhook  (raw body — no requireAuth, signature verified by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  async function updateByCustomer(customerId, fields) {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update(fields)
      .eq('stripe_customer_id', customerId);
    if (error) console.error('[stripe webhook] supabase update error:', error);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await updateByCustomer(session.customer, {
        subscription_status: 'active',
        subscription_id: session.subscription,
      });
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await updateByCustomer(sub.customer, {
        subscription_status: sub.status === 'active' ? 'active' : 'free',
        subscription_id: sub.id,
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await updateByCustomer(sub.customer, {
        subscription_status: 'free',
        subscription_id: null,
      });
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

module.exports = router;
