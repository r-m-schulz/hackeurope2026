const supabase = require('../supabaseClient');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired token' });

  req.userId = data.user.id;
  req.userType = data.user.user_metadata?.user_type;
  next();
}

module.exports = { requireAuth };
