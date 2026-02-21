require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Service role client — bypasses RLS, for server-side DB operations only
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabaseAdmin;
