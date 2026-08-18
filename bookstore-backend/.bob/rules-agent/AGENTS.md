# Project Coding Rules (Non-Obvious Only)

- Never `require('../server.js')` in tests — use `tests/helpers.js` which rebuilds the Express app without calling `listen`.
- All DB writes with multiple steps (order placement, cancel) must use `pool.connect()` with `BEGIN`/`COMMIT`/`ROLLBACK` and `client.release()` in `finally`.
- Order IDs are `VARCHAR(50)` strings (`ORD-<timestamp>`), not integers — don't treat them as numbers in queries or comparisons.
- Cart item mapping in `placeOrder` handles both `item.book_id`/`item.id` and `item.quantity`/`item.qty` — maintain this dual-key tolerance when modifying order logic.
- Gift discount deduction formula: `pointsUsed = giftDiscount * 100` (100 points = $1). Don't change this ratio without checking the frontend.
- When adding a new test file, always call `await pool.end()` in `afterAll`, and use `cleanupUser()` for any inserted users.
- No linter enforces style — match existing: CommonJS, 2-space indent, single quotes, trailing commas.
