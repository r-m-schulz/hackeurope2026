const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

router.post("/signup", async (req, res) => {
  const { email, password, user_type } = req.body;

  if (!user_type || !['sme', 'individual'].includes(user_type)) {
    return res.status(400).json({ error: 'user_type is required and must be "sme" or "individual"' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_type },
    },
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    message: "Signup successful",
    user_id: data.user?.id,
    email: data.user?.email,
    user_type: data.user?.user_metadata?.user_type,
    access_token: data.session?.access_token,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    status: "success",
    user_type: data.user?.user_metadata?.user_type,
    access_token: data.session?.access_token,
  });
});

module.exports = router;
