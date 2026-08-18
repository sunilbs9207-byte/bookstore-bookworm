const pool = require('../config/db')
// Get cart items
const getCart = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id,
        c.quantity,
        b.id AS book_id,
        b.title,
        b.author,
        b.price,
        b.image_url,
        b.delivery_days,
        b.rating,
        cat.name AS category,
        br.name AS brand,
        (b.price * c.quantity) AS subtotal
      FROM cart c
      JOIN books b ON c.book_id = b.id
      LEFT JOIN categories cat ON b.category_id = cat.id
      LEFT JOIN brands br ON b.brand_id = br.id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC`,
      [req.user.id]
    )
    const total = result.rows.reduce(
      (sum, item) => sum + parseFloat(item.subtotal), 0
    )
    res.json({
      items: result.rows,
      total: total.toFixed(2),
      count: result.rows.length,
    })
  } catch (err) {
    console.error('Get cart error:', err)
    res.status(500).json({ error: 'Server error fetching cart' })
  }
}
// Add to cart
const addToCart = async (req, res) => {
  const { bookId, quantity = 1 } = req.body
  try {
    // Check book exists
    const book = await pool.query(
      'SELECT id, stock FROM books WHERE id = $1',
      [bookId]
    )
    if (book.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }
    if (book.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' })
    }
    // Upsert cart item
    const result = await pool.query(
      `INSERT INTO cart (user_id, book_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, book_id)
       DO UPDATE SET quantity = cart.quantity + $3
       RETURNING *`,
      [req.user.id, bookId, quantity]
    )
        res.status(201).json({
      message: 'Book added to cart',
      item: result.rows[0]
    })
  } catch (err) {
    console.error('Add to cart error:', err)
    res.status(500).json({ error: 'Server error adding to cart' })
  }
}
// Update cart quantity
const updateCartItem = async (req, res) => {
  const { id } = req.params
  const { quantity } = req.body
  try {
    if (quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be at least 1' 
      })
    }
    const result = await pool.query(
      `UPDATE cart 
       SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' })
    }
    res.json({
      message: 'Cart updated',
      item: result.rows[0]
    })
  } catch (err) {
    console.error('Update cart error:', err)
    res.status(500).json({ error: 'Server error updating cart' })
  }
}
// Remove from cart
const removeFromCart = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `DELETE FROM cart 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' })
    }
    res.json({ message: 'Item removed from cart' })
  } catch (err) {
    console.error('Remove from cart error:', err)
    res.status(500).json({ error: 'Server error removing from cart' })
  }
}
// Clear entire cart
const clearCart = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id = $1',
      [req.user.id]
    )
    res.json({ message: 'Cart cleared successfully' })
  } catch (err) {
    console.error('Clear cart error:', err)
    res.status(500).json({ error: 'Server error clearing cart' })
  }
}
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
}