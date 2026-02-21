const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return res.status(400).json(error);

  res.json(data);
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(400).json(error);

  res.json(data);
});

module.exports = router;