const pool = require('../config/db')
// Get all books
const getAllBooks = async (req, res) => {
  try {
    const { category, brand, search } = req.query
    let query = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.price,
        b.image_url,
        b.delivery_days,
        b.rating,
        b.stock,
        c.name AS category,
        br.name AS brand,
        CURRENT_DATE + b.delivery_days * INTERVAL '1 day' 
          AS delivery_date
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN brands br ON b.brand_id = br.id
      WHERE 1=1
    `
    const params = []
    let paramCount = 1
    // Filter by category
    if (category && category !== 'All') {
      query += ` AND c.name = $${paramCount}`
      params.push(category)
      paramCount++
    }
    // Filter by brand
    if (brand && brand !== 'All') {
      query += ` AND br.name = $${paramCount}`
      params.push(brand)
      paramCount++
    }
    // Search by title or author
    if (search) {
      query += ` AND (
        LOWER(b.title) LIKE $${paramCount} OR 
        LOWER(b.author) LIKE $${paramCount}
      )`
      params.push(`%${search.toLowerCase()}%`)
      paramCount++
    }
    query += ' ORDER BY b.id ASC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Get books error:', err)
    res.status(500).json({ error: 'Server error fetching books' })
  }
}
// Get single book
const getBookById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT 
        b.id,
        b.title,
        b.author,
        b.price,
        b.image_url,
        b.delivery_days,
        b.rating,
        b.stock,
        c.name AS category,
        br.name AS brand,
        CURRENT_DATE + b.delivery_days * INTERVAL '1 day' 
          AS delivery_date
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN brands br ON b.brand_id = br.id
      WHERE b.id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get book error:', err)
    res.status(500).json({ error: 'Server error fetching book' })
  }
}
// Get related books by category
const getRelatedBooks = async (req, res) => {
  try {
    const { id } = req.params
    // Get current book category
    const book = await pool.query(
      'SELECT category_id FROM books WHERE id = $1',
      [id]
    )
    if (book.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }
    const categoryId = book.rows[0].category_id
    // Get related books
    const result = await pool.query(
      `SELECT 
        b.id, b.title, b.author, b.price,
        b.image_url, b.rating, b.delivery_days,
        c.name AS category, br.name AS brand
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN brands br ON b.brand_id = br.id
      WHERE b.category_id = $1 AND b.id != $2
      LIMIT 4`,
      [categoryId, id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get related books error:', err)
    res.status(500).json({ error: 'Server error fetching related books' })
  }
}
// Get all categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching categories' })
  }
}
// Get all brands
const getBrands = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM brands ORDER BY name ASC'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching brands' })
  }
}
module.exports = {
  getAllBooks,
  getBookById,
  getRelatedBooks,
  getCategories,
  getBrands,
}