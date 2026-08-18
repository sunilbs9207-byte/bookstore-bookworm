const pool = require('../config/db')
// Get all orders for user
const getOrders = async (req, res) => {
  try {
    // Get orders
    const ordersResult = await pool.query(
      `SELECT 
        o.id,
        o.status,
        o.subtotal,
        o.gift_discount,
        o.total,
        o.payment_method,
        o.created_at,
        a.name AS address_name,
        a.line1,
        a.line2,
        a.city,
        a.state,
        a.zip,
        a.country
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC`,
      [req.user.id]
    )
    // Get order items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT 
            oi.id,
            oi.book_id,
            oi.title,
            oi.quantity,
            oi.price,
            (oi.price * oi.quantity) AS subtotal
          FROM order_items oi
          WHERE oi.order_id = $1`,
          [order.id]
        )
        return {
          ...order,
          items: itemsResult.rows,
        }
      })
    )
    res.json(orders)
  } catch (err) {
    console.error('Get orders error:', err)
    res.status(500).json({ error: 'Server error fetching orders' })
  }
}
// Get single order
const getOrderById = async (req, res) => {
  const { id } = req.params
  try {
    const orderResult = await pool.query(
      `SELECT 
        o.id,
        o.status,
        o.subtotal,
        o.gift_discount,
        o.total,
        o.payment_method,
        o.created_at,
        a.name AS address_name,
        a.line1,
        a.line2,
        a.city,
        a.state,
        a.zip,
        a.country
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = $1 AND o.user_id = $2`,
      [id, req.user.id]
    )
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }
    const itemsResult = await pool.query(
      `SELECT 
        oi.id,
        oi.book_id,
        oi.title,
        oi.quantity,
        oi.price,
        (oi.price * oi.quantity) AS subtotal
      FROM order_items oi
      WHERE oi.order_id = $1`,
      [id]
    )
    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    })
  } catch (err) {
    console.error('Get order error:', err)
    res.status(500).json({ error: 'Server error fetching order' })
  }
}
// Place new order
const placeOrder = async (req, res) => {
  const {
    addressId,
    paymentMethod,
    cartItems,
    subtotal,
    giftDiscount,
    total,
  } = req.body
  // Start transaction
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Generate order ID
    const orderId = `ORD-${Date.now()}`
    // Create order
    await client.query(
      `INSERT INTO orders 
        (id, user_id, address_id, payment_method, 
         subtotal, gift_discount, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Processing')`,
      [
        orderId,
        req.user.id,
        addressId,
        paymentMethod,
        subtotal,
        giftDiscount,
        total,
      ]
    )
    // Insert order items
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items 
          (order_id, book_id, title, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          item.book_id || item.id,
          item.title,
          item.quantity || item.qty,
          item.price,
        ]
      )
      // Update book stock
      await client.query(
        `UPDATE books 
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity || item.qty, item.book_id || item.id]
      )
    }
    // Deduct gift points if used
    if (giftDiscount > 0) {
      const pointsUsed = giftDiscount * 100
      await client.query(
        `UPDATE users 
         SET gift_points = gift_points - $1
         WHERE id = $2`,
        [pointsUsed, req.user.id]
      )
    }
    // Clear cart after order placed
    await client.query(
      'DELETE FROM cart WHERE user_id = $1',
      [req.user.id]
    )
    // Commit transaction
    await client.query('COMMIT')
    // Fetch complete order to return
    const orderResult = await pool.query(
      `SELECT 
        o.id,
        o.status,
        o.subtotal,
        o.gift_discount,
        o.total,
        o.payment_method,
        o.created_at,
        a.name AS address_name,
        a.line1,
        a.city,
        a.state,
        a.zip
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = $1`,
      [orderId]
    )
    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    )
    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      }
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Place order error:', err)
    res.status(500).json({ error: 'Server error placing order' })
  } finally {
    client.release()
  }
}
// Cancel order
const cancelOrder = async (req, res) => {
  const { id } = req.params
  try {
    // Get order
    const orderResult = await pool.query(
      `SELECT id, status, created_at 
       FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }
    const order = orderResult.rows[0]
    // Check if order is already cancelled
    if (order.status === 'Cancelled') {
      return res.status(400).json({ 
        error: 'Order is already cancelled' 
      })
    }
    // Check 48 hour window
    const orderTime = new Date(order.created_at).getTime()
    const currentTime = Date.now()
    const hoursDiff = (currentTime - orderTime) / (1000 * 60 * 60)
    if (hoursDiff > 48) {
      return res.status(400).json({
        error: 'Order cannot be cancelled after 48 hours'
      })
    }
    // Start transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // Update order status
      await client.query(
        `UPDATE orders SET status = 'Cancelled'
         WHERE id = $1`,
        [id]
      )
      // Restore book stock
      const items = await client.query(
        `SELECT book_id, quantity 
         FROM order_items 
         WHERE order_id = $1`,
        [id]
      )
      for (const item of items.rows) {
        await client.query(
          `UPDATE books 
           SET stock = stock + $1
           WHERE id = $2`,
          [item.quantity, item.book_id]
        )
      }
      await client.query('COMMIT')
      res.json({ 
        message: 'Order cancelled successfully',
        orderId: id 
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Cancel order error:', err)
    res.status(500).json({ error: 'Server error cancelling order' })
  }
}
// Get recommendations based on order history
const getRecommendations = async (req, res) => {
  try {
    // Find most ordered category
    const categoryResult = await pool.query(
      `SELECT 
        b.category_id,
        c.name AS category,
        COUNT(*) AS order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN books b ON oi.book_id = b.id
      JOIN categories c ON b.category_id = c.id
      WHERE o.user_id = $1
      GROUP BY b.category_id, c.name
      ORDER BY order_count DESC
      LIMIT 1`,
      [req.user.id]
    )
    let recommendedBooks
    if (categoryResult.rows.length > 0) {
      const topCategoryId = categoryResult.rows[0].category_id
      // Get books from top category not yet ordered
      recommendedBooks = await pool.query(
        `SELECT 
          b.id, b.title, b.author, b.price,
          b.image_url, b.rating, b.delivery_days,
          c.name AS category, br.name AS brand
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN brands br ON b.brand_id = br.id
        WHERE b.category_id = $1
        AND b.id NOT IN (
          SELECT DISTINCT oi.book_id
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = $2
        )
        LIMIT 3`,
        [topCategoryId, req.user.id]
      )
    } else {
      // No order history - return top rated books
      recommendedBooks = await pool.query(
        `SELECT 
          b.id, b.title, b.author, b.price,
          b.image_url, b.rating, b.delivery_days,
          c.name AS category, br.name AS brand
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN brands br ON b.brand_id = br.id
        ORDER BY b.rating DESC
        LIMIT 3`
      )
    }
    res.json(recommendedBooks.rows)
  } catch (err) {
    console.error('Recommendations error:', err)
    res.status(500).json({ error: 'Server error fetching recommendations' })
  }
}
module.exports = {
  getOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
  getRecommendations,
}