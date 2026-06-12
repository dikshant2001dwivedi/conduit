# TASKS — Incremental Django -> NestJS Migration

Last Updated: 2026-06-12

Status keys:
- [ ] not started
- [-] in progress
- [x] complete

## Global Rules
- Complete exactly one atomic task at a time.
- Do not start next task until current task verification passes.
- After each task: update PROJECT-STATE.md and commit.

## Common Pre/Post Commands (every task)

### Before task
```bash
cd ../realWorld-DjangoRestFramework
python manage.py test
```

### After task (minimum)
```bash
cd ../conduit
npm run build
BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern <domain>
```

---

## Phase 0 — Contract Capture

### Phase acceptance criteria
- Contract suite exists and passes against Django (`BASE_URL=http://localhost:8000`)
- All endpoint groups covered (auth, profiles, articles, comments, tags)
- BUG-001 and BUG-002 explicitly asserted

### Tasks

#### [ ] 0.1 Run Django baseline tests
- Objective: Validate source behavior baseline.
- Definition of Done: `python manage.py test` passes.
- Files likely involved: none (execution only).
- Verification steps: check exit code 0 and test summary `OK`.
- Tests to run: Django suite (`python manage.py test`).
- Commit message template: `chore(baseline): verify django test suite passes`

#### [ ] 0.2 Create contract test harness in conduit
- Objective: Create Jest/Supertest contract infrastructure.
- Definition of Done: `test/contracts/` created with Jest config.
- Files likely involved:
  - `test/contracts/jest-contract.json`
  - test setup helper file(s)
- Verification steps: `npx jest --config test/contracts/jest-contract.json --listTests` shows contract files.
- Tests to run: `BASE_URL=http://localhost:8000 npx jest --config test/contracts/jest-contract.json`
- Commit message template: `test(contracts): scaffold contract test harness`

#### [ ] 0.3 Implement auth/user contract tests
- Objective: Codify register/login/current-user contracts from Django.
- Definition of Done: auth contract tests pass vs Django.
- Files likely involved: `test/contracts/auth.contract.spec.ts`
- Verification steps: run only auth contract file against `:8000`.
- Tests to run:
  - `BASE_URL=http://localhost:8000 npx jest --config test/contracts/jest-contract.json --testPathPattern auth`
- Commit message template: `test(contracts): add auth and user endpoint contracts`

#### [ ] 0.4 Implement profile contract tests
- Objective: Capture profile/get/follow/unfollow contracts.
- Definition of Done: profile contract tests pass vs Django.
- Files likely involved: `test/contracts/profiles.contract.spec.ts`
- Verification steps: run profile contract subset.
- Tests to run:
  - `BASE_URL=http://localhost:8000 npx jest --config test/contracts/jest-contract.json --testPathPattern profiles`
- Commit message template: `test(contracts): add profile endpoint contracts`

#### [ ] 0.5 Implement article/tag/comment contract tests
- Objective: Capture article lifecycle + feed + favorites + comments + tags.
- Definition of Done: contracts pass vs Django and include BUG-001/BUG-002 assertions.
- Files likely involved:
  - `test/contracts/articles.contract.spec.ts`
  - `test/contracts/comments.contract.spec.ts`
  - `test/contracts/tags.contract.spec.ts`
- Verification steps: run full contract suite against Django.
- Tests to run:
  - `BASE_URL=http://localhost:8000 npx jest --config test/contracts/jest-contract.json`
- Commit message template: `test(contracts): add article comment tag contracts incl preserved bugs`

---

## Phase 1 — NestJS Setup

### Phase acceptance criteria
- Nest app scaffolding complete
- Strict TS enabled
- Env/config wiring complete
- Global validation + error envelope filter present
- Swagger available

### Tasks

#### [ ] 1.1 Scaffold NestJS app
- Objective: Generate baseline app in target repo.
- Definition of Done: `npm run start:dev` starts successfully.
- Files likely involved: `src/main.ts`, `src/app.module.ts`, `package.json`, `tsconfig.json`
- Verification steps: hit app root and ensure service starts.
- Tests to run: `npm run build`
- Commit message template: `chore(setup): scaffold nestjs application`

#### [ ] 1.2 Install migration dependencies
- Objective: Install Prisma, auth, validation, swagger, test deps.
- Definition of Done: lockfile updated and build passes.
- Files likely involved: `package.json`, lockfile.
- Verification steps: `npm ls` and `npm run build` pass.
- Tests to run: `npm run build`
- Commit message template: `chore(setup): install migration dependencies`

#### [ ] 1.3 Configure strict TS + config module
- Objective: enforce strict typing and environment loading.
- Definition of Done: strict compile without new TS warnings/errors.
- Files likely involved: `tsconfig.json`, `src/app.module.ts`, `.env.example`
- Verification steps: `npm run build`.
- Tests to run: `npm run build`
- Commit message template: `chore(setup): enable strict typescript and config`

#### [ ] 1.4 Add global validation and error envelope
- Objective: enforce DTO validation and Django-style error shape.
- Definition of Done: invalid request returns `{errors:{body:[...]}}`.
- Files likely involved: `src/main.ts`, `src/common/filters/http-exception.filter.ts`
- Verification steps: curl invalid payload and inspect response shape.
- Tests to run: `npm run build`
- Commit message template: `feat(core): add validation pipe and error envelope filter`

#### [ ] 1.5 Configure Swagger
- Objective: expose API docs in Nest.
- Definition of Done: `/swagger` works and documents Bearer auth.
- Files likely involved: `src/main.ts`
- Verification steps: open `http://localhost:3000/swagger`.
- Tests to run: `npm run build`
- Commit message template: `feat(core): configure swagger docs`

---

## Phase 2 — Database and Entities

### Phase acceptance criteria
- Prisma schema represents User/Article/Comment/Tag and relations
- `conduit_nest` migration applied successfully
- Prisma client injectable via PrismaModule

### Tasks

#### [ ] 2.1 Create `conduit_nest` database
- Objective: provision target DB.
- Definition of Done: DB exists and is connectable.
- Files likely involved: none.
- Verification steps: connect with psql and list DBs.
- Tests to run: `npx prisma db pull` (or `prisma migrate status`).
- Commit message template: `chore(db): create conduit_nest database`

#### [ ] 2.2 Define Prisma schema
- Objective: map Django domain to Prisma entities/relations.
- Definition of Done: schema validates.
- Files likely involved: `prisma/schema.prisma`
- Verification steps: `npx prisma validate`.
- Tests to run: `npx prisma validate`
- Commit message template: `feat(prisma): define initial schema`

#### [ ] 2.3 Apply Prisma migration
- Objective: create DB tables via migration.
- Definition of Done: migration applied and prisma client generated.
- Files likely involved: `prisma/migrations/**`, `prisma/schema.prisma`
- Verification steps: `npx prisma migrate dev --name init` passes.
- Tests to run: `npx prisma migrate status`
- Commit message template: `feat(prisma): apply initial database migration`

#### [ ] 2.4 Add PrismaModule/PrismaService
- Objective: central DB access service.
- Definition of Done: inject PrismaService in sample module.
- Files likely involved:
  - `src/prisma/prisma.module.ts`
  - `src/prisma/prisma.service.ts`
- Verification steps: app boots and DI resolves PrismaService.
- Tests to run: `npm run build`
- Commit message template: `feat(prisma): add prisma module and service`

---

## Phase 3 — Authentication

### Phase acceptance criteria
- Register/login/current-user/update-user endpoints implemented
- JWT auth with Bearer token working
- Auth contract tests pass against NestJS

### Tasks

#### [ ] 3.1 Scaffold auth and users modules
- Objective: generate module/controller/service skeletons.
- Definition of Done: modules compile.
- Files likely involved: `src/auth/**`, `src/users/**`
- Verification steps: `npm run build`
- Tests to run: `npm run build`
- Commit message template: `chore(auth): scaffold auth and users modules`

#### [ ] 3.2 Implement user registration endpoint
- Objective: POST `/api/users`.
- Definition of Done: creates user with hashed password and correct response envelope.
- Files likely involved: auth/users DTOs, controllers, services.
- Verification steps: POST valid + invalid payloads.
- Tests to run:
  - `BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json --testPathPattern auth`
- Commit message template: `feat(auth): implement POST /api/users`

#### [ ] 3.3 Implement login + JWT issuance
- Objective: POST `/api/users/login` returning 202.
- Definition of Done: valid creds return token; invalid creds return error envelope.
- Files likely involved: `src/auth/**`
- Verification steps: login then hit protected endpoint with Bearer token.
- Tests to run: auth contract tests.
- Commit message template: `feat(auth): implement POST /api/users/login`

#### [ ] 3.4 Implement GET/PUT current user
- Objective: protected current-user endpoints.
- Definition of Done: GET/PUT `/api/user` pass contracts.
- Files likely involved: `src/users/**`
- Verification steps: verify auth required and update behavior.
- Tests to run: auth contract tests.
- Commit message template: `feat(users): implement GET and PUT /api/user`

---

## Phase 4 — User/Profile Endpoints

### Phase acceptance criteria
- Profile read/follow/unfollow behaviors match contract
- Optional auth and following flag behavior verified

### Tasks

#### [ ] 4.1 Scaffold profiles module
- Objective: generate profile module skeleton.
- Definition of Done: compile passes.
- Files likely involved: `src/profiles/**`
- Verification steps: `npm run build`
- Tests to run: `npm run build`
- Commit message template: `chore(profiles): scaffold profiles module`

#### [ ] 4.2 Implement GET profile
- Objective: GET `/api/profiles/:username`.
- Definition of Done: response shape and following field behavior match contract.
- Files likely involved: `src/profiles/**`
- Verification steps: with and without auth token.
- Tests to run: profile contract tests.
- Commit message template: `feat(profiles): implement GET profile endpoint`

#### [ ] 4.3 Implement follow/unfollow
- Objective: POST/DELETE follow endpoints.
- Definition of Done: relationship toggles and errors handled.
- Files likely involved: `src/profiles/**`
- Verification steps: repeated follow/unfollow and self-follow checks.
- Tests to run: profile contract tests.
- Commit message template: `feat(profiles): implement follow and unfollow endpoints`

---

## Phase 5 — Articles and Tags

### Phase acceptance criteria
- Article CRUD, filtering, feed, favorites, tags implemented
- BUG-001 and BUG-002 preserved
- Articles/tags contract tests pass

### Tasks

#### [ ] 5.1 Scaffold articles and tags modules
- Objective: generate module skeletons.
- Definition of Done: compile passes.
- Files likely involved: `src/articles/**`, `src/tags/**`
- Verification steps: `npm run build`
- Tests to run: `npm run build`
- Commit message template: `chore(articles): scaffold articles and tags modules`

#### [ ] 5.2 Implement create/list articles with filters
- Objective: POST/GET `/api/articles` including tag/author/favorited/limit/offset.
- Definition of Done: create + filters pass contract subset.
- Files likely involved: articles controller/service/DTOs.
- Verification steps: create seed data then run filter queries.
- Tests to run: articles contract tests.
- Commit message template: `feat(articles): implement create and list article endpoints`

#### [ ] 5.3 Implement feed endpoint preserving BUG-001
- Objective: GET `/api/articles/feed`.
- Definition of Done: response key remains `comments`, count `articleCount`.
- Files likely involved: articles service/controller.
- Verification steps: follow users then fetch feed and assert keys.
- Tests to run: articles contract tests.
- Commit message template: `feat(articles): implement feed endpoint preserving bug-001`

#### [ ] 5.4 Implement article get/update/delete preserving BUG-002
- Objective: GET/PUT/DELETE `/api/articles/:slug`.
- Definition of Done: author authorization works; `updatedAt` stays frozen on update.
- Files likely involved: articles service/controller/DTOs.
- Verification steps: update article and compare timestamps.
- Tests to run: articles contract tests.
- Commit message template: `feat(articles): implement article detail endpoints preserving bug-002`

#### [ ] 5.5 Implement favorite/unfavorite
- Objective: POST/DELETE `/api/articles/:slug/favorite`.
- Definition of Done: favorited/favoritesCount behavior matches contract.
- Files likely involved: articles service/controller.
- Verification steps: favorite twice and unfavorite flow checks.
- Tests to run: articles contract tests.
- Commit message template: `feat(articles): implement favorite and unfavorite endpoints`

#### [ ] 5.6 Implement tags endpoint
- Objective: GET `/api/tags`.
- Definition of Done: returns distinct tag list.
- Files likely involved: `src/tags/**`
- Verification steps: create tagged articles and query tags.
- Tests to run: tags contract tests.
- Commit message template: `feat(tags): implement GET /api/tags`

---

## Phase 6 — Comments

### Phase acceptance criteria
- Comments list/create/delete behavior matches Django contracts
- Create returns 200 (preserved source behavior)

### Tasks

#### [ ] 6.1 Scaffold comments module
- Objective: generate comments module skeleton.
- Definition of Done: compile passes.
- Files likely involved: `src/comments/**`
- Verification steps: `npm run build`
- Tests to run: `npm run build`
- Commit message template: `chore(comments): scaffold comments module`

#### [ ] 6.2 Implement list/create comments
- Objective: GET/POST `/api/articles/:slug/comments`.
- Definition of Done: optional-auth GET and auth-required POST pass contracts.
- Files likely involved: comments controller/service/DTOs.
- Verification steps: verify POST status 200 and response shape.
- Tests to run: comments contract tests.
- Commit message template: `feat(comments): implement list and create comment endpoints`

#### [ ] 6.3 Implement delete comment
- Objective: DELETE `/api/articles/:slug/comments/:id`.
- Definition of Done: author-only deletion behavior passes contracts.
- Files likely involved: comments controller/service.
- Verification steps: non-author deletion returns error.
- Tests to run: comments contract tests.
- Commit message template: `feat(comments): implement delete comment endpoint`

---

## Phase 7 — Final Validation

### Phase acceptance criteria
- Full contract suite passes against NestJS
- Build passes with zero TypeScript errors
- Project documentation updated for clean resume/start

### Tasks

#### [ ] 7.1 Run full contract suite against NestJS
- Objective: final behavioral parity validation.
- Definition of Done: all contract tests green against `BASE_URL=http://localhost:3000`.
- Files likely involved: test files + any fixes from failures.
- Verification steps: no skipped/only tests; full pass summary.
- Tests to run:
  - `BASE_URL=http://localhost:3000 npx jest --config test/contracts/jest-contract.json`
- Commit message template: `test(contracts): full suite passing on nestjs`

#### [ ] 7.2 Build and static validation
- Objective: ensure production compile health.
- Definition of Done: `npm run build` passes.
- Files likely involved: whichever files required to fix build.
- Verification steps: build exit code 0.
- Tests to run: `npm run build`
- Commit message template: `chore(release): pass final build verification`

#### [ ] 7.3 Final docs checkpoint
- Objective: ensure resume workflow is complete and current.
- Definition of Done: PROJECT-STATE.md, TASKS.md, MIGRATION-MAP.md, DOCUMENT-CHANGES.md all updated and consistent.
- Files likely involved: those four docs + README if needed.
- Verification steps: open all docs and validate no contradictory statuses.
- Tests to run: not applicable (docs); optionally re-run full contract suite.
- Commit message template: `docs(migration): finalize state and workflow docs`
