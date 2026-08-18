# Project Documentation Context (Non-Obvious Only)

- `tests/helpers.js` is not just a utility file — it is the actual Express app used in all tests. `server.js` is never imported by tests.
- `schema.sql` contains both the schema and seed data (books, categories, brands). Running it on an existing DB is safe due to `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.
- There is no migration system — schema changes require manual `ALTER TABLE` or dropping and re-running `schema.sql`.
- `.env.test` configures tests against the real `bookstore_db` database (not an in-memory or separate test DB), so tests are destructive unless `cleanupUser()` is called.
- The OpenAPI spec is in `openapi.yaml` at the project root — this is the canonical API reference.
