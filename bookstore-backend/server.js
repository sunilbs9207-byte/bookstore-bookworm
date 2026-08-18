const express = require('express')
const cors = require('cors')
require('dotenv').config()
// Import routes
const authRoutes = require('./src/routes/authRoutes')
const bookRoutes = require('./src/routes/bookRoutes')
const cartRoutes = require('./src/routes/cartRoutes')
const orderRoutes = require('./src/routes/orderRoutes')
const addressRoutes = require('./src/routes/addressRoutes')
const app = express()
const PORT = process.env.PORT || 5000
// ===== MIDDLEWARE =====
app.use(cors({
  origin: /^http:\/\/localhost(:\d+)?$/,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// ===== ROUTES =====
app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/addresses', addressRoutes)
// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bookstore API is running',
    timestamp: new Date().toISOString(),
  })
})
// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})
// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})
// ===== START SERVER =====
// Export app for testing
module.exports = app
// Only listen if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
    console.log(`📚 Bookstore API ready`)
  })
}