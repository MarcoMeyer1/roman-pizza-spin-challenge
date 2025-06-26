const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Register new customer
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('email')
      .eq('email', email);

    if (checkError) throw checkError;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, email, password: hashedPassword }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Customer registered' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
