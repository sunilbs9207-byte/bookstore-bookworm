/**
 * tests/auth.test.js
 * ──────────────────
 * POST /api/auth/register  – success, duplicate e-mail
 * POST /api/auth/login     – success, wrong password, wrong email
 * GET  /api/auth/profile   – with valid token, without token
 */
const request = require('supertest')
const { app, pool, createTestUser, authHeader, cleanupUser } = require('./helpers')

// ── state shared across tests in this suite ──────────────────────────────────
let registeredUserId = null
const TEST_EMAIL    = `auth_test_${Date.now()}@jest.local`
const TEST_PASSWORD = 'SecurePass99!'
const TEST_NAME     = 'Auth Test User'

afterAll(async () => {
  await cleanupUser(registeredUserId)
  await pool.end()
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  test('201 – registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({
      name:  TEST_NAME,
      email: TEST_EMAIL,
    })
    expect(res.body.user).toHaveProperty('id')
    // Store id so afterAll can clean up
    registeredUserId = res.body.user.id
  })

  test('400 – duplicate e-mail returns error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/already registered/i)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  test('200 – correct credentials return token and user object', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({ email: TEST_EMAIL })
    expect(res.body.user).toHaveProperty('id')
    expect(res.body.user).toHaveProperty('gift_points')
  })

  test('401 – wrong password returns error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPassword!' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/invalid email or password/i)
  })

  test('401 – unknown e-mail returns error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.test', password: TEST_PASSWORD })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toMatch(/invalid email or password/i)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/auth/profile
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/profile', () => {
  let token

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    token = loginRes.body.token
  })

  test('200 – valid token returns profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', authHeader(token))

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ email: TEST_EMAIL })
    expect(res.body).toHaveProperty('created_at')
    expect(res.body).not.toHaveProperty('password_hash')
  })

  test('401 – missing token is rejected', async () => {
    const res = await request(app).get('/api/auth/profile')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  test('403 – invalid / tampered token is rejected', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer this.is.not.valid')

    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error')
  })
})
