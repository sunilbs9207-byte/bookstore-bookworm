const express = require('express')
const router = express.Router()
const {
  getOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
  getRecommendations,
} = require('../controllers/orderController')
const authenticateToken = require('../middleware/auth')
// All order routes are protected
router.use(authenticateToken)
router.get('/', getOrders)
router.get('/recommendations', getRecommendations)
router.get('/:id', getOrderById)
router.post('/', placeOrder)
router.put('/:id/cancel', cancelOrder)
module.exports = router