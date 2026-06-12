# Documentation Changes Log
# Conduit — Django → NestJS Migration

---

## Workflow System Changes

### [2026-06-12] Context System Migration: Windsurf/Claude -> GitHub Copilot

**Original:** Workflow guidance was built around `.windsurfrules` and Claude chat continuity.
**Changed to:** Workflow is now file-driven for GitHub Copilot with:
- `.copilot-instructions.md`
- `PROJECT-STATE.md`
- `TASKS.md`
- `MIGRATION-MAP.md`
- `DOCUMENT-CHANGES.md`
**Reason:** Copilot sessions must resume from repository files, not prior chat context.
**Files affected:** Context-preservation system docs and workflow bootstrap files.
**Implementation status:** Implemented

---

## Deliberate Deviations from Django Source

### [2026-06-12] JWT Authorization Header Prefix

**Original (Django):** `Authorization: Token <jwt>`
**Changed to:** `Authorization: Bearer <jwt>`
**Reason:** `Token` prefix is a DRF session-token convention that leaked into JWT usage. `Bearer` is the RFC 6750 standard. All major clients and tools default to Bearer. No live production client exists that would break.
**Files affected:** All protected endpoints, JWT strategy
**Implementation status:** Planned (Phase 3)

---

### [2026-06-12] Error Handling — Bare Exception Swallowing

**Original (Django):** All views wrap logic in bare `except Exception` blocks that always return 404/400 regardless of root cause. Real errors (DB failures, programming errors) are silently swallowed.
**Changed to:** NestJS will catch specific exception types, log real errors, and return appropriate HTTP status codes. Only expected not-found cases return 404; unexpected errors propagate as 500.
**Reason:** Required for debuggability during migration. The bare-catch pattern makes it impossible to distinguish a missing record from a programming error.
**Files affected:** All controllers and services
**Implementation status:** Planned (Phases 3–6)

---

## Known Bugs — Preserved in NestJS (Documented)

The following bugs exist in the Django source. They are **preserved as-is** in the NestJS
implementation to maintain contract parity. They are candidates for a future cleanup pass.

---

### BUG-001 — Feed Response Key Wrong

**Location:** `articles/views.py` → `ArticleView.feed()`
**Django behaviour:** `GET /api/articles/feed` returns `{ "comments": [...], "articleCount": N }`
**Expected (RealWorld spec):** `{ "articles": [...], "articlesCount": N }`
**Preserved in NestJS:** Yes — NestJS will return `comments` key and `articleCount` (no trailing `s`) to match Django output
**Risk:** Any client consuming the feed endpoint receives a misnamed key
**Fix effort:** Trivial — rename one key in the response DTO
**Tracking:** Resolve in a post-migration cleanup PR
**Contract test note:** Contract test for feed MUST assert `comments` key and `articleCount` (not `articles`/`articlesCount`)

---

### BUG-002 — Article `updatedAt` Never Changes

**Location:** `articles/models.py` → `Article.updated = models.DateTimeField(auto_now_add=True)`
**Django behaviour:** `updatedAt` is set once at creation and never updated when the article is edited. Uses `auto_now_add` instead of `auto_now`.
**Expected:** `updatedAt` should reflect the last modification time
**Preserved in NestJS:** Yes — Prisma schema will use `@default(now())` without `@updatedAt` for the `updated` field, replicating the frozen-timestamp behaviour
**Risk:** Consumers cannot rely on `updatedAt` to detect article edits
**Fix effort:** Low — change `@default(now())` to `@updatedAt` in Prisma schema + migration
**Tracking:** Resolve in a post-migration cleanup PR
**Contract test note:** Contract test for article update MUST assert `updatedAt` equals the original creation timestamp (not a new timestamp)

---

## Future Cleanup Candidates (post-migration)

| ID      | Description                              | Effort | Phase to fix |
|---------|------------------------------------------|--------|--------------|
| BUG-001 | Feed response key `comments` → `articles`| Trivial | Post Phase 7 |
| BUG-002 | `updatedAt` frozen on edit               | Low     | Post Phase 7 |
| CLEAN-001 | Add `articlesCount` to list responses  | Low     | Post Phase 7 |
| CLEAN-002 | Standardise pagination (limit/offset)  | Medium  | Post Phase 7 |
