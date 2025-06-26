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
    // Check if the email already exists in the database
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('email')
      .eq('email', email);

    // If there's an error querying the database, throw it
    if (checkError) throw checkError;

    // If the email is already in use, return a 400 error
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash the plain text password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new customer into the database with the hashed password
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, email, password: hashedPassword }]);

    // If Supabase returns an error, respond with a 400 status
    if (error) return res.status(400).json({ error: error.message });

    // Success: return confirmation
    res.status(200).json({ message: 'Customer registered' });
  } catch (err) {
    // Handle unexpected server errors
    res.status(500).json({ error: 'Server error' });
  }
});


// Login existing customer
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
   
    const { data: users, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .limit(1);

    // Extract the first user if found, otherwise null
    const user = users && users.length > 0 ? users[0] : null;

    // Compare provided password with hashed password if user exists
    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

    // Generic error to avoid revealing whether email or password is incorrect
    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Login successful – return basic user info (temp for testing)
    res.status(200).json({
      message: 'Login successful',
      customer: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    // Handle unexpected errors
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new spin entry for the customer (no restrictions, easy to test with this way)
app.post('/api/spin', async (req, res) => {
  const { customerId } = req.body;

  try {
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Select a random prize from the available options
    const prizes = ['10% Off', 'Free Pepsi', 'Free Pizza', 'Try Again'];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    // Insert the spin into the database
    const { data, error } = await supabase
      .from('spins')
      .insert([{ customer_id: customerId, prize }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Spin successful', prize });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if the customer is allowed to spin (72-hour cooldown rule)
app.get('/api/next-spin/:customerId', async (req, res) => {
  const { customerId } = req.params;

  try {
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get the most recent spin for the customer
    const { data: lastSpin, error } = await supabase
      .from('spins')
      .select('spun_at')
      .eq('customer_id', customerId)
      .order('spun_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    // Not span yet — user can spin now
    if (lastSpin.length === 0) {
      return res.status(200).json({ nextSpinAt: null, canSpin: true });
    }

    const lastSpinTime = new Date(lastSpin[0].spun_at);
    const now = new Date();
    const hoursSinceLastSpin = (now - lastSpinTime) / (1000 * 60 * 60);

    // More than 72 hours since last spin — eligible
    if (hoursSinceLastSpin >= 72) {
      return res.status(200).json({ nextSpinAt: null, canSpin: true });
    }

    // If user is not eligible yet — return when they can spin again
    const nextSpinAt = new Date(lastSpinTime.getTime() + 72 * 60 * 60 * 1000);
    res.status(200).json({
      nextSpinAt: nextSpinAt.toISOString(),
      canSpin: false
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
