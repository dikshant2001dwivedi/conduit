# Conduit (NestJS) - Django to Nest Migration Target

This repository is the NestJS implementation of the RealWorld Conduit API, migrated from the Django/DRF source project.

## What This Project Contains

- NestJS API with modular domains:
  - auth and users
  - profiles
  - articles
  - comments
  - tags
- Prisma ORM over PostgreSQL
- JWT authentication (`Authorization: Bearer <token>`)
- Contract-test suite used for behavior parity and regression checks
- Swagger docs at `/swagger`

## Tech Stack

- Node.js + TypeScript
- NestJS 10
- Prisma 6
- PostgreSQL
- Jest + Supertest (contract tests)

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local)

## Environment Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Confirm `.env` values:

- `PORT` (default: `3000`)
- `DATABASE_URL` (default points to `conduit_nest`)
- `JWT_SECRET`

Example from `.env.example`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/conduit_nest?schema=public
JWT_SECRET=dev_jwt_secret
```

## Install and Bootstrap

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

## Run the API

Development mode:

```bash
npm run start:dev
```

Production build + run:

```bash
npm run build
npm run start:prod
```

Swagger UI:

- http://localhost:3000/swagger

Quick verify:

```bash
npm run start:dev
# open http://localhost:3000/swagger
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json
```

## Testing

### Build check

```bash
npm run build
```

### Full contract suite (NestJS target)

Make sure API is running on port `3000`.

```bash
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json
```

### Domain-only contract runs

```bash
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern auth
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern profiles
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern articles
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern comments
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern tags
```

## Project Structure and Navigation

Top-level:

- `src/` application code
- `prisma/` schema and migrations
- `test/contracts/` behavior contract tests
- `TASKS.md` migration execution checklist
- `PROJECT-STATE.md` current migration state and verification history
- `MIGRATION-MAP.md` source-to-target mapping
- `DOCUMENT-CHANGES.md` deliberate behavior changes and cleanup notes

Key modules:

- `src/auth/` JWT strategy, guards, login/register entry points
- `src/users/` current-user (`/api/user`) endpoints
- `src/profiles/` follow/unfollow and profile reads
- `src/articles/` CRUD, filters, feed, favorites
- `src/comments/` list/create/delete comment flows
- `src/tags/` public tags endpoint
- `src/prisma/` Prisma service/module and DB wiring
- `src/common/filters/` global HTTP error envelope mapping

## API Behavior Notes

- Authentication uses `Bearer` scheme (not DRF `Token`).
- Validation is enforced globally with Nest `ValidationPipe`.
- Errors are normalized into Django-style envelope shape where applicable.

## Post-Migration Bug Cleanup (Applied)

The two known legacy Django behavior bugs are fixed in this NestJS codebase:

1. Feed response keys
- `GET /api/articles/feed` now returns `{ articles, articlesCount }`

2. Article updated timestamp
- `PUT /api/articles/:slug` now updates `updatedAt` correctly on edits

If you need strict legacy parity for historical comparison, use the source Django repository as baseline reference.

## Useful Commands

```bash
# Build
npm run build

# Start dev server
npm run start:dev

# Run full contract suite against local Nest server
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json
```
