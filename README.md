# Escrow-MVP
This is an Escrow Service project to help businesses transact safely 

## Local development with Postgres (tests)

This repo includes a `docker-compose.yml` with a Postgres service. To run the tests locally you'll need a Postgres instance and the environment variables configured.

1. Copy `.env.example` to `.env` and update values if necessary.

2. Start Postgres via docker-compose:

```powershell
docker-compose up -d
```

3. Run Prisma migrations (if needed) and generate client. If you don't have migrations, you can run `prisma db push` to push the schema:

```powershell
npx prisma db push --preview-feature
npx prisma generate
```

4. Run tests (make sure `.env` contains `DATABASE_URL` and `SESSION_SECRET`):

```powershell
npm test
```

If you prefer not to use Docker, set up a local Postgres instance and set `DATABASE_URL` accordingly.

## Quick local development without Docker (SQLite)

If you don't want to run Postgres locally, the project includes a SQLite option for fast local development and tests.

1. Create an SQLite env file (optional):

```powershell
copy .env.sqlite .env.local
# or create `.env` with DATABASE_URL="file:./dev.db"
```

2. Push the SQLite schema and generate the client:

```powershell
npx cross-env DATABASE_URL="file:./dev.db" prisma db push --schema=prisma/schema.sqlite.prisma
npx cross-env DATABASE_URL="file:./dev.db" prisma generate --schema=prisma/schema.sqlite.prisma
```

3. Seed the SQLite DB:

```powershell
npx cross-env DATABASE_URL="file:./dev.db" ts-node --transpile-only prisma/seed.ts
```

4. Start the Next dev server using SQLite:

```powershell
npx cross-env DATABASE_URL="file:./dev.db" npm run dev
```

5. Run tests against SQLite:

```powershell
npx cross-env DATABASE_URL="file:./dev.db" jest --runInBand
```

This flow is convenient for UI development and unit/integration tests. For production and CI use Postgres.

