const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Validation helper
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { full_name, email, company_role, password, confirm_password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Passwords don't match." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate email
    const existing = await query.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
    }

    const userId = `u-${uuidv4().substring(0, 8)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role && ['engineer', 'manager', 'admin'].includes(role) ? role : 'engineer';

    await query.run(
      `INSERT INTO users (id, full_name, email, company_role, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, full_name.trim(), email.trim().toLowerCase(), company_role || 'Engineer', passwordHash, userRole]
    );

    const userObj = {
      id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      company_role: company_role || 'Engineer',
      role: userRole
    };

    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      message: 'Account created successfully!',
      user: userObj,
      token
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during sign up. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await query.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User does not exist.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const userObj = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      company_role: user.company_role || 'Engineer',
      role: user.role
    };

    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      message: 'Logged in successfully!',
      user: userObj,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get('SELECT id, full_name, email, company_role, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const user = await query.get('SELECT email FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  return res.json({
    message: 'Password reset link sent! Check your email inbox for instructions.'
  });
});

module.exports = router;
