/**
 * tests/books.test.js
 * ───────────────────
 * All /api/books routes are public (no auth required).
 *
 * GET /api/books                – full list
 * GET /api/books?category=…     – category filter
 * GET /api/books?search=…       – title/author search
 * GET /api/books/:id            – single book / 404 for missing
 * GET /api/books/:id/related    – related books
 * GET /api/books/categories     – categories array
 * GET /api/books/brands         – brands array
 */
const request = require('supertest')
const { app, pool } = require('./helpers')

// Capture a real book ID for the parametrised tests
let firstBookId
let firstBookCategory

beforeAll(async () => {
  const result = await pool.query('SELECT id, category_id FROM books ORDER BY id ASC LIMIT 1')
  if (result.rows.length > 0) {
    firstBookId = result.rows[0].id
  }
  // Grab a category name for filter test
  const catResult = await pool.query(
    `SELECT c.name FROM books b
     JOIN categories c ON b.category_id = c.id
     ORDER BY b.id ASC LIMIT 1`
  )
  firstBookCategory = catResult.rows[0]?.name ?? null
})

afterAll(async () => {
  await pool.end()
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/books
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/books', () => {
  test('200 – returns an array of books', async () => {
    const res = await request(app).get('/api/books')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    // Each book has expected fields
    if (res.body.length > 0) {
      const book = res.body[0]
      expect(book).toHaveProperty('id')
      expect(book).toHaveProperty('title')
      expect(book).toHaveProperty('author')
      expect(book).toHaveProperty('price')
    }
  })

  test('200 – category filter returns only matching books', async () => {
    if (!firstBookCategory) return // skip if DB is empty

    const res = await request(app)
      .get(`/api/books?category=${encodeURIComponent(firstBookCategory)}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    res.body.forEach((book) => {
      expect(book.category).toBe(firstBookCategory)
    })
  })

  test('200 – search query filters by title/author', async () => {
    // Search for a substring that is very likely to appear in at least one title
    const res = await request(app).get('/api/books?search=the')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    // Every returned book must match the search term in title or author
    res.body.forEach((book) => {
      const combined = `${book.title} ${book.author}`.toLowerCase()
      expect(combined).toMatch('the')
    })
  })

  test('200 – ?category=All returns all books (no filter)', async () => {
    const allRes   = await request(app).get('/api/books')
    const allCatRes = await request(app).get('/api/books?category=All')

    expect(allCatRes.status).toBe(200)
    expect(allCatRes.body.length).toBe(allRes.body.length)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/books/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/books/:id', () => {
  test('200 – valid id returns book object', async () => {
    if (!firstBookId) return

    const res = await request(app).get(`/api/books/${firstBookId}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', firstBookId)
    expect(res.body).toHaveProperty('title')
    expect(res.body).toHaveProperty('price')
    expect(res.body).toHaveProperty('stock')
  })

  test('404 – non-existent id returns error', async () => {
    const res = await request(app).get('/api/books/999999999')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/not found/i)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/books/:id/related
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/books/:id/related', () => {
  test('200 – returns array of related books (same category, excluding self)', async () => {
    if (!firstBookId) return

    const res = await request(app).get(`/api/books/${firstBookId}/related`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    // The current book must not appear in results
    const ids = res.body.map((b) => b.id)
    expect(ids).not.toContain(firstBookId)
    // At most 4
    expect(res.body.length).toBeLessThanOrEqual(4)
  })

  test('404 – related for non-existent book returns error', async () => {
    const res = await request(app).get('/api/books/999999999/related')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/books/categories
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/books/categories', () => {
  test('200 – returns array of category objects', async () => {
    const res = await request(app).get('/api/books/categories')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/books/brands
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/books/brands', () => {
  test('200 – returns array of brand objects', async () => {
    const res = await request(app).get('/api/books/brands')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name')
    }
  })
})
