const express = require('express')
const router = express.Router()
const {
  getAllBooks,
  getBookById,
  getRelatedBooks,
  getCategories,
  getBrands,
} = require('../controllers/bookController')
// All book routes are public
router.get('/', getAllBooks)
router.get('/categories', getCategories)
router.get('/brands', getBrands)
router.get('/:id', getBookById)
router.get('/:id/related', getRelatedBooks)
module.exports = router