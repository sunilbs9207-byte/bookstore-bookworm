const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
// Register
const register = async (req, res) => {
  const { name, email, password } = req.body
  try {
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      })
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, gift_points`,
      [name, email, passwordHash]
    )
    const user = result.rows[0]
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    res.status(201).json({ user, token })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error during registration' })
  }
}
// Login
const login = async (req, res) => {
  const { email, password } = req.body
  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      })
    }
    const user = result.rows[0]
    // Check password
    const validPassword = await bcrypt.compare(
      password, 
      user.password_hash
    )
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      })
    }
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gift_points: user.gift_points,
      },
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error during login' })
  }
}
// Get Profile
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, gift_points, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}
module.exports = { register, login, getProfile }