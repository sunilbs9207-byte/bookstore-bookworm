# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
Node.js + Express, PostgreSQL (via `pg` Pool), JWT auth, bcrypt, Jest + Supertest.

## Commands
```bash
npm test                          # run all tests
npx jest tests/auth.test.js       # run a single test file
npm run test:coverage             # coverage report (output: coverage/)
npm run dev                       # nodemon (dev only)
```
All commands must be run from `bookstore-backend/`.

## Database Setup
- Schema + seed data: `psql -U bookstore_user -d bookstore_db -f schema.sql`
- Tests use a **live PostgreSQL database** (not mocks) — `.env.test` points to `bookstore_db` on port `5432`.
- Tests require the DB to be seeded; `books.test.js` skips assertions silently if the table is empty.

## Test Conventions
- All tests import `{ app, pool, createTestUser, authHeader, cleanupUser }` from `tests/helpers.js` — never `require('../server.js')` directly (helpers.js rebuilds the Express app to prevent `app.listen` from firing).
- Each test file calls `pool.end()` in `afterAll` — if you add a new test file, do the same.
- `cleanupUser(userId)` deletes cart → order_items → orders → addresses → users in the correct FK order. Always call it in `afterAll` for any test that inserts a user.
- Use `createTestUser(suffix)` to generate isolated test users; suffix defaults to `Date.now()` to avoid email collisions across parallel suites.

## Code Style
- CommonJS (`require`/`module.exports`) throughout — no ES modules.
- No linter config present; follow existing style: 2-space indent, single quotes, trailing commas in objects/arrays.
- Controllers are plain `async (req, res)` functions exported as named properties — no classes.
- All DB queries use parameterized `$1`/`$2` placeholders directly on `pool.query(sql, params)`.
- Multi-step writes (order placement, cancellation) use `pool.connect()` + explicit `BEGIN`/`COMMIT`/`ROLLBACK` with `client.release()` in `finally`.

## Key Non-Obvious Patterns
- **Order IDs are strings** (`VARCHAR(50)`), generated as `` `ORD-${Date.now()}` `` — not serial integers.
- **Gift points → currency**: 100 points = $1. `placeOrder` deducts `giftDiscount * 100` points.
- **Cart items payload is flexible**: `placeOrder` accepts either `item.book_id` or `item.id`, and either `item.quantity` or `item.qty` for frontend compatibility.
- **`server.js` skips `app.listen` when `NODE_ENV=test`** — but tests don't set that; instead `helpers.js` reconstructs the app independently.
- CORS is restricted to `localhost` (any port) in production; `helpers.js` uses an open CORS config for tests.
- New users start with `gift_points = 500` (DB default, not application logic).
