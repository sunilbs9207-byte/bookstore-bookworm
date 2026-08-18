const express = require('express')
const router = express.Router()
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController')
const authenticateToken = require('../middleware/auth')

// All address routes require a valid JWT
router.use(authenticateToken)

router.get('/',     getAddresses)
router.post('/',    addAddress)
router.put('/:id',  updateAddress)
router.delete('/:id', deleteAddress)

module.exports = router
