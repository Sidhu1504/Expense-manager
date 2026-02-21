const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

const showRegister = (req, res) => {
  res.render('register', { error: null, user: null });
};

const showLogin = (req, res) => {
  res.render('login', { error: null, user: null });
};

const register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.render('register', { error: 'All fields are required', user: null });
  }

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match', user: null });
  }

  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters', user: null });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.render('register', { error: 'Email already registered', user: null });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password_hash]
    );

    const user = result.rows[0];

    // Insert default categories
    const defaults = [
      { name: 'Salary', type: 'income' },
      { name: 'Freelance', type: 'income' },
      { name: 'Business', type: 'income' },
      { name: 'Investment', type: 'income' },
      { name: 'Food & Dining', type: 'expense' },
      { name: 'Transportation', type: 'expense' },
      { name: 'Shopping', type: 'expense' },
      { name: 'Bills & Utilities', type: 'expense' },
      { name: 'Healthcare', type: 'expense' },
      { name: 'Entertainment', type: 'expense' },
      { name: 'Education', type: 'expense' },
      { name: 'Rent', type: 'expense' },
    ];

    for (const cat of defaults) {
      await pool.query(
        'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3)',
        [user.id, cat.name, cat.type]
      );
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    });

    res.redirect('/');
  } catch (err) {
    console.error('Register error:', err);
    res.render('register', { error: 'Registration failed. Please try again.', user: null });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required', user: null });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.render('login', { error: 'Invalid email or password', user: null });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.render('login', { error: 'Invalid email or password', user: null });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    });

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Login failed. Please try again.', user: null });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};

module.exports = { showRegister, showLogin, register, login, logout };
