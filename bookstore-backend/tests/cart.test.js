/**
 * tests/cart.test.js
 * ──────────────────
 * All /api/cart routes require JWT auth.
 *
 * GET    /api/cart        – authenticated / unauthenticated (401)
 * POST   /api/cart        – add valid book, invalid bookId
 * PUT    /api/cart/:id    – update quantity
 * DELETE /api/cart/:id    – remove single item
 * DELETE /api/cart        – clear entire cart
 */
const request = require('supertest')
const {
  app,
  pool,
  createTestUser,
  authHeader,
  getFirstBook,
  cleanupUser,
} = require('./helpers')

let user
let token
let firstBook    // seeded book used for all add-to-cart calls

beforeAll(async () => {
  ;({ user, token } = await createTestUser('cart'))
  firstBook = await getFirstBook()
})

beforeEach(async () => {
  // Ensure cart is empty before every test
  if (user) {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [user.id])
  }
})

afterAll(async () => {
  await cleanupUser(user?.id)
  await pool.end()
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/cart
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/cart', () => {
  test('200 – authenticated user gets their cart', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('count')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  test('401 – request without token is rejected', async () => {
    const res = await request(app).get('/api/cart')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/cart
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/cart', () => {
  test('201 – adds a valid book to the cart', async () => {
    if (!firstBook) return // skip if DB has no books

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', authHeader(token))
      .send({ bookId: firstBook.id, quantity: 1 })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message')
    expect(res.body.message).toMatch(/added to cart/i)
    expect(res.body).toHaveProperty('item')
    expect(res.body.item.book_id).toBe(firstBook.id)
  })

  test('404 – non-existent bookId returns 404', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', authHeader(token))
      .send({ bookId: 999999999, quantity: 1 })

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/not found/i)
  })

  test('401 – unauthenticated add is rejected', async () => {
    if (!firstBook) return

    const res = await request(app)
      .post('/api/cart')
      .send({ bookId: firstBook.id, quantity: 1 })

    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/cart/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('PUT /api/cart/:id', () => {
  let cartItemId

  beforeEach(async () => {
    if (!firstBook) return
    // Seed one item
    const addRes = await request(app)
      .post('/api/cart')
      .set('Authorization', authHeader(token))
      .send({ bookId: firstBook.id, quantity: 1 })
    cartItemId = addRes.body.item?.id
  })

  test('200 – updates quantity of an existing cart item', async () => {
    if (!cartItemId) return

    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set('Authorization', authHeader(token))
      .send({ quantity: 3 })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('message')
    expect(res.body.item.quantity).toBe(3)
  })

  test('400 – quantity < 1 is rejected', async () => {
    if (!cartItemId) return

    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set('Authorization', authHeader(token))
      .send({ quantity: 0 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('404 – updating another user\'s cart item is rejected', async () => {
    if (!cartItemId) return

    // Create a second user who doesn't own this cart item
    const { token: otherToken, user: otherUser } = await createTestUser('cart_other')
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set('Authorization', authHeader(otherToken))
      .send({ quantity: 2 })

    expect(res.status).toBe(404)
    await cleanupUser(otherUser.id)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/cart/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('DELETE /api/cart/:id', () => {
  test('200 – removes a cart item by id', async () => {
    if (!firstBook) return

    const addRes = await request(app)
      .post('/api/cart')
      .set('Authorization', authHeader(token))
      .send({ bookId: firstBook.id, quantity: 1 })
    const itemId = addRes.body.item?.id

    const res = await request(app)
      .delete(`/api/cart/${itemId}`)
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/removed/i)
  })

  test('404 – deleting non-existent item returns 404', async () => {
    const res = await request(app)
      .delete('/api/cart/999999999')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/cart  (clear all)
// ═══════════════════════════════════════════════════════════════════════════
describe('DELETE /api/cart', () => {
  test('200 – clears the entire cart', async () => {
    // Seed at least one item first (if a book exists)
    if (firstBook) {
      await request(app)
        .post('/api/cart')
        .set('Authorization', authHeader(token))
        .send({ bookId: firstBook.id, quantity: 1 })
    }

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/cleared/i)

    // Verify cart is now empty
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', authHeader(token))
    expect(cartRes.body.count).toBe(0)
  })
})
