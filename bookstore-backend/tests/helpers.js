/**
 * Shared test helpers
 * ──────────────────
 * - Loads .env before anything else
 * - Exports the Express app (without calling listen)
 * - Exports pool so individual test files can seed / clean DB
 * - Exports helpers to create a test user and return a signed JWT
 */
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../src/config/db')

// ── app (no listen) ───────────────────────────────────────────────────────────
// We require server.js but intercept app.listen so tests stay silent.
// Simpler: reconstruct the express app here from scratch.
const express = require('express')
const cors = require('cors')
const authRoutes = require('../src/routes/authRoutes')
const bookRoutes = require('../src/routes/bookRoutes')
const cartRoutes = require('../src/routes/cartRoutes')
const orderRoutes = require('../src/routes/orderRoutes')
const addressRoutes = require('../src/routes/addressRoutes')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/addresses', addressRoutes)
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// ── seed helpers ──────────────────────────────────────────────────────────────

/**
 * Insert a fresh test user and return { user, token }.
 * Uses a unique e-mail each call so parallel suites don't collide.
 */
async function createTestUser(suffix = Date.now()) {
  const email = `testuser_${suffix}@jest.local`
  const passwordHash = await bcrypt.hash('Test1234!', 10)
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, name, email, gift_points`,
    [`Test User ${suffix}`, email, passwordHash]
  )
  const user = result.rows[0]
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  return { user, token, password: 'Test1234!' }
}

/** Build an Authorization header value from a token string */
const authHeader = (token) => `Bearer ${token}`

/**
 * Return the first book in the DB (used by cart / order tests).
 * Returns null if the books table is empty.
 */
async function getFirstBook() {
  const result = await pool.query('SELECT * FROM books ORDER BY id ASC LIMIT 1')
  return result.rows[0] ?? null
}

/**
 * Return the first address belonging to a user, or null.
 */
async function getFirstAddress(userId) {
  const result = await pool.query(
    'SELECT * FROM addresses WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  return result.rows[0] ?? null
}

/**
 * Wipe all rows related to a test user.
 * Call in afterEach / afterAll to keep the DB clean.
 */
async function cleanupUser(userId) {
  if (!userId) return
  await pool.query('DELETE FROM cart        WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [userId])
  await pool.query('DELETE FROM orders      WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM addresses   WHERE user_id = $1', [userId])
  await pool.query('DELETE FROM users       WHERE id      = $1', [userId])
}

module.exports = {
  app,
  pool,
  createTestUser,
  authHeader,
  getFirstBook,
  getFirstAddress,
  cleanupUser,
}
