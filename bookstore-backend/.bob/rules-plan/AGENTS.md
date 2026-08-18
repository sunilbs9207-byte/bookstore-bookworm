# Project Architecture Rules (Non-Obvious Only)

- Tests run against the **live production database** (`bookstore_db`) — there is no separate test DB or mocking layer. Any schema change must be backward-compatible or all tests break.
- Order cancellation has a hardcoded **48-hour window** enforced in application logic (not DB constraints) — any cancellation feature change must keep this rule.
- Stock is decremented synchronously inside the `placeOrder` transaction and restored inside `cancelOrder` transaction. There is no async job or queue.
- The `orders` table uses `VARCHAR(50)` PKs (`ORD-<timestamp>`), while all other tables use `SERIAL` integer PKs — cross-table joins must account for this type mismatch.
- `getOrders` issues N+1 queries (one per order to fetch items) — acceptable for current scale, but worth noting before adding pagination or bulk endpoints.
- CORS whitelist is regex-based (`/^http:\/\/localhost(:\d+)?$/`) — only localhost origins are accepted; any deployment to a non-localhost frontend requires this to change.
- No rate limiting, input validation library, or request sanitization exists — these would need to be added before any public-facing deployment.
