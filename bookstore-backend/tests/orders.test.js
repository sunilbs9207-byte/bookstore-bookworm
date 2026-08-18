/**
 * tests/orders.test.js
 * ─────────────────────
 * All /api/orders routes require JWT auth.
 *
 * GET  /api/orders                      – returns user's orders
 * POST /api/orders                      – place a valid order
 * GET  /api/orders/recommendations      – returns books array
 * GET  /api/orders/:id                  – own order / wrong user → 404
 * PUT  /api/orders/:id/cancel           – within 48 hrs (ok) / after 48 hrs (400)
 */
const request = require('supertest')
const {
  app,
  pool,
  createTestUser,
  authHeader,
  getFirstBook,
  getFirstAddress,
  cleanupUser,
} = require('./helpers')

let user
let token
let firstBook
let addressId  // address seeded for this user

// ── helpers ───────────────────────────────────────────────────────────────────
/**
 * Place an order via the API and return the full response.
 * Requires an address row to exist for the user.
 */
async function placeOrder(authToken, aId, bookList) {
  const subtotal = bookList.reduce((s, b) => s + b.price * (b.qty ?? 1), 0)
  return request(app)
    .post('/api/orders')
    .set('Authorization', authHeader(authToken))
    .send({
      addressId:    aId,
      paymentMethod: 'credit',
      cartItems:    bookList.map((b) => ({
        book_id:  b.id,
        title:    b.title,
        quantity: b.qty ?? 1,
        price:    b.price,
      })),
      subtotal:     parseFloat(subtotal.toFixed(2)),
      giftDiscount: 0,
      total:        parseFloat(subtotal.toFixed(2)),
    })
}

beforeAll(async () => {
  ;({ user, token } = await createTestUser('orders'))
  firstBook = await getFirstBook()

  // Seed an address for the test user
  const addrRes = await pool.query(
    `INSERT INTO addresses (user_id, name, line1, city, state, zip, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id`,
    [user.id, 'Test Address', '123 Test St', 'Test City', 'TS', '00000', 'US']
  )
  addressId = addrRes.rows[0].id
})

beforeEach(async () => {
  // Clear order_items + orders for a clean slate each test
  if (user) {
    await pool.query(
      `DELETE FROM order_items WHERE order_id IN
        (SELECT id FROM orders WHERE user_id = $1)`,
      [user.id]
    )
    await pool.query('DELETE FROM orders WHERE user_id = $1', [user.id])
    // Restore cart so place-order tests can re-add stock
    await pool.query('DELETE FROM cart WHERE user_id = $1', [user.id])
  }
})

afterAll(async () => {
  await cleanupUser(user?.id)
  await pool.end()
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/orders
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/orders', () => {
  test('200 – authenticated user gets an array of orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('401 – unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/orders')

    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/orders
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/orders', () => {
  test('201 – places an order and returns order object', async () => {
    if (!firstBook || !addressId) return

    const res = await placeOrder(token, addressId, [firstBook])

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message')
    expect(res.body.message).toMatch(/successfully/i)
    expect(res.body.order).toHaveProperty('id')
    expect(res.body.order).toHaveProperty('status', 'Processing')
    expect(Array.isArray(res.body.order.items)).toBe(true)
    expect(res.body.order.items.length).toBeGreaterThan(0)
  })

  test('401 – unauthenticated order is rejected', async () => {
    if (!firstBook || !addressId) return

    const res = await request(app)
      .post('/api/orders')
      .send({ addressId, paymentMethod: 'credit', cartItems: [], subtotal: 0, giftDiscount: 0, total: 0 })

    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/orders/recommendations
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/orders/recommendations', () => {
  test('200 – returns an array of recommended books', async () => {
    const res = await request(app)
      .get('/api/orders/recommendations')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('title')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/orders/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/orders/:id', () => {
  test('200 – owner can fetch their own order', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', orderId)
    expect(res.body).toHaveProperty('items')
  })

  test('404 – different user cannot see the order', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    // Second user
    const { token: otherToken, user: otherUser } = await createTestUser('orders_other')
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', authHeader(otherToken))

    expect(res.status).toBe(404)
    await cleanupUser(otherUser.id)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/orders/:id/cancel
// ═══════════════════════════════════════════════════════════════════════════
describe('PUT /api/orders/:id/cancel', () => {
  test('200 – cancels an order placed within 48 hours', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/cancelled/i)
  })

  test('400 – cancelling an already-cancelled order is rejected', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    // First cancel
    await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', authHeader(token))

    // Second cancel attempt
    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/already cancelled/i)
  })

  test('400 – cancelling after 48 hours is rejected', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    // Back-date the order by 49 hours directly in the DB
    const past = new Date(Date.now() - 49 * 60 * 60 * 1000)
    await pool.query(
      'UPDATE orders SET created_at = $1 WHERE id = $2',
      [past, orderId]
    )

    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/48 hours/i)
  })

  test('404 – cancelling another user\'s order returns 404', async () => {
    if (!firstBook || !addressId) return

    const placeRes = await placeOrder(token, addressId, [firstBook])
    const orderId = placeRes.body.order?.id
    if (!orderId) return

    const { token: otherToken, user: otherUser } = await createTestUser('orders_cancel')
    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', authHeader(otherToken))

    expect(res.status).toBe(404)
    await cleanupUser(otherUser.id)
  })
})
