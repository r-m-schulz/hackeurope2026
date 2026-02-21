const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    message: "Signup successful",
    user_id: data.user?.id,
    email: data.user?.email,
    access_token: data.session?.access_token
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ status: "success" });
});

module.exports = router;