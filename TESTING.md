# Testing

## Unit tests (no database)

```bash
npm test
```

Runs every `src/**/*.test.ts` — pure logic only (crypto, payments signature,
premium gating, design-token sanitization, rate limiter). No external services
required.

## Integration tests (require Postgres)

DB-backed tests live in `src/**/*.itest.ts` and run against a **separate test
database** (never your dev/prod DB). They exercise the real Prisma queries —
currently the anti-abuse rules in `validateVouchRules`.

One-time setup (local):

```bash
# Create the test DB (owned by your app DB user), then push the schema:
sudo -u postgres psql -c "CREATE DATABASE vouchdb_test OWNER vouchuser;"
TEST_DATABASE_URL="postgresql://USER:PASS@localhost:5432/vouchdb_test" \
  npx prisma db push --skip-generate
```

Run them:

```bash
TEST_DATABASE_URL="postgresql://USER:PASS@localhost:5432/vouchdb_test" npm run test:db
```

The script points `DATABASE_URL` at `TEST_DATABASE_URL` for the run, so the
Prisma client connects to the test DB. Each test cleans up the rows it creates.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `dev`/`main`: it spins up a
Postgres service, generates the Prisma client, applies the schema, then runs
type-check → lint (non-blocking) → unit tests → integration tests → production
build. It runs alongside `deploy.yml` (which deploys on push to `dev`) but does
not gate it.
