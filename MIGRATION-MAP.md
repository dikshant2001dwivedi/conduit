# Django -> NestJS Migration Map

Last Updated: 2026-06-12
Source: ../realWorld-DjangoRestFramework
Target: conduit

## 1) Architecture Map

| Concern | Django (Source) | NestJS (Target) |
|---|---|---|
| Runtime | Python 3.11 | Node.js 20 + TypeScript |
| Framework | Django 4.2 + DRF | NestJS |
| ORM | Django ORM + django-taggit | Prisma |
| DB | PostgreSQL | PostgreSQL (`conduit_nest`) |
| Auth | simplejwt + custom login views | passport-jwt + @nestjs/jwt |
| API docs | drf-yasg `/swagger/` | @nestjs/swagger `/swagger` |

## 2) Domain Model Mapping

### User
Django (`accounts/models.py`):
- email (unique, login identity)
- username
- bio
- image
- followers: ManyToMany(User, asymmetrical)

NestJS/Prisma target:
- User table with self-relation (`following` / `followedBy`)
- email as unique login identity

### Article
Django (`articles/models.py`):
- author (FK User)
- title (unique)
- summary -> API `description`
- content -> API `body`
- slug (unique, generated from title)
- tags (taggit)
- favorites (M2M User)
- created / updated

NestJS/Prisma target:
- Article table + Tag table + M2M joins
- preserve BUG-002 (`updatedAt` frozen) during migration

### Comment
Django (`comments/models.py`):
- article FK
- author FK
- content -> API `body`
- created / updated

NestJS/Prisma target:
- Comment table with FK to Article/User

## 3) Endpoint Mapping

Base prefix: `/api`

### Auth/User
| Method | Django Route | NestJS Route | Notes |
|---|---|---|---|
| POST | /users | /users | register |
| POST | /users/login | /users/login | returns 202 |
| GET | /user | /user | auth required |
| PUT | /user | /user | auth required |

### Profiles
| Method | Django Route | NestJS Route | Notes |
|---|---|---|---|
| GET | /profiles/:username | /profiles/:username | optional auth |
| POST | /profiles/:username/follow | /profiles/:username/follow | auth required |
| DELETE | /profiles/:username/follow | /profiles/:username/follow | auth required |

### Articles
| Method | Django Route | NestJS Route | Notes |
|---|---|---|---|
| GET | /articles | /articles | filters: tag/author/favorited/limit/offset |
| POST | /articles | /articles | auth required |
| GET | /articles/feed | /articles/feed | preserve BUG-001 response key |
| GET | /articles/:slug | /articles/:slug | optional auth |
| PUT | /articles/:slug | /articles/:slug | author only |
| DELETE | /articles/:slug | /articles/:slug | author only |
| POST | /articles/:slug/favorite | /articles/:slug/favorite | auth required |
| DELETE | /articles/:slug/favorite | /articles/:slug/favorite | auth required |

### Comments/Tags
| Method | Django Route | NestJS Route | Notes |
|---|---|---|---|
| GET | /articles/:slug/comments | /articles/:slug/comments | optional auth |
| POST | /articles/:slug/comments | /articles/:slug/comments | auth required; preserve 200 status |
| DELETE | /articles/:slug/comments/:id | /articles/:slug/comments/:id | auth required |
| GET | /tags | /tags | public |

## 4) Auth and Security Mapping

| Item | Django | NestJS Target |
|---|---|---|
| JWT issue | simplejwt RefreshToken.for_user | JwtService.sign |
| Header used in tests | `Token <jwt>` | `Bearer <jwt>` |
| Password hashing | Django user.set_password | bcrypt hash/compare |
| Permission styles | IsAuthenticated / IsAuthenticatedOrReadOnly | JwtAuthGuard + optional auth guard |

## 5) Middleware/Filters Mapping

Django middleware observed:
- SecurityMiddleware
- WhiteNoiseMiddleware
- SessionMiddleware
- CommonMiddleware
- CsrfViewMiddleware
- AuthenticationMiddleware
- MessageMiddleware
- XFrameOptionsMiddleware

NestJS equivalents to apply:
- global ValidationPipe
- global HttpExceptionFilter to enforce `{ errors: { body: [] } }`
- optional Helmet/CORS config (if needed)

## 6) Background Jobs

Current state: none in source.
Target: none required for migration.

## 7) External Integrations

Source dependencies relevant to behavior:
- django-taggit -> map to relational Tag model in Prisma
- markdown -> optional (only needed if markdown rendering endpoint is introduced)
- drf-yasg -> replaced by @nestjs/swagger

## 8) Existing Tests and Contract Role

Source tests exist:
- accounts/tests.py
- articles/tests.py
- comments/tests.py

These are behavior references, not sufficient migration gates alone.
Primary migration gate is contract tests in target repo under `test/contracts`.

## 9) Known Bugs to Preserve During Migration

- BUG-001: `/api/articles/feed` returns `comments` key and `articleCount`
- BUG-002: `updatedAt` does not change on article updates

See DOCUMENT-CHANGES.md.

## 10) Migration Risks and Assumptions

### Risks
- Incomplete response-shape parity between DRF serializers and Nest DTOs
- Auth behavior drift due to header prefix change
- Tag relation/query behavior drift under Prisma
- Error status divergence after removing broad exception swallowing

### Assumptions
- No requirement to run both apps in production simultaneously
- Incremental phases are for debugging and isolation, not traffic splitting
- Source repo remains read-only reference during migration
- PostgreSQL accessible locally and `conduit_nest` can be created

## 11) Contract Testing Strategy

### Goal
Use existing Django behavior as executable contracts, then pass the same contracts against NestJS.

### Before each migration task
1. Run source baseline:
```bash
cd ../realWorld-DjangoRestFramework
python manage.py test
```
2. Ensure source server is available (for baseline/diagnostics):
```bash
python manage.py runserver 0.0.0.0:8000
```

### During/after each migration task
1. Implement only one atomic task.
2. Run task-domain tests in NestJS.
3. Run contract tests for that domain:
```bash
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern <domain>
```
4. If failing, fix before moving on.

### Final validation
Run full contract suite + build:
```bash
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json
npm run build
```

### Contract file set (target)
- test/contracts/auth.contract.spec.ts
- test/contracts/profiles.contract.spec.ts
- test/contracts/articles.contract.spec.ts
- test/contracts/comments.contract.spec.ts
- test/contracts/tags.contract.spec.ts
- test/contracts/jest-contract.json
