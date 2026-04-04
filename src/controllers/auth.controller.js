const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Email already exist කරනවාද check කරනවා
    const [existing] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Password hash කරනවා
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB එකට save කරනවා
    const [result] = await db.query(
      'INSERT INTO User (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, address]
    );

    res.status(201).json({ message: '✅ User registered successfully', userId: result.insertId });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User ඉන්නවාද check කරනවා
    const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Password check කරනවා
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // JWT token හදනවා
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '✅ Login successful',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

module.exports = { register, login };