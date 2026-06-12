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
**Implementation status:** Implemented (Phase 3)

---

### [2026-06-12] Error Handling — Bare Exception Swallowing

**Original (Django):** All views wrap logic in bare `except Exception` blocks that always return 404/400 regardless of root cause. Real errors (DB failures, programming errors) are silently swallowed.
**Changed to:** NestJS will catch specific exception types, log real errors, and return appropriate HTTP status codes. Only expected not-found cases return 404; unexpected errors propagate as 500.
**Reason:** Required for debuggability during migration. The bare-catch pattern makes it impossible to distinguish a missing record from a programming error.
**Files affected:** All controllers and services
**Implementation status:** Implemented (Phases 3–6)

---

## Finalization Checkpoint

### [2026-06-12] Phase 6-7 Completion and Docs Freeze

**Original:** Documentation tracked progress through Phase 5 with pending completion markers.
**Changed to:** Phase 6 (comments) and Phase 7 (final validation) are fully complete with final contract/build verification and synchronized task/state docs.
**Reason:** Migration reached final exit criteria for parity and documentation consistency.
**Files affected:** `PROJECT-STATE.md`, `TASKS.md`, `MIGRATION-MAP.md`, `DOCUMENT-CHANGES.md`
**Implementation status:** Implemented

---

## Legacy Bugs From Django (Historical)

The following bugs exist in the Django source. They were initially preserved during migration for
contract parity and were fixed during post-migration cleanup.

---

### BUG-001 — Feed Response Key Wrong

**Location:** `articles/views.py` → `ArticleView.feed()`
**Django behaviour:** `GET /api/articles/feed` returns `{ "comments": [...], "articleCount": N }`
**Expected (RealWorld spec):** `{ "articles": [...], "articlesCount": N }`
**Preserved in NestJS during migration:** Yes
**Risk:** Any client consuming the feed endpoint receives a misnamed key
**Fix effort:** Trivial — rename one key in the response DTO
**Tracking:** Resolved in post-migration cleanup
**Current NestJS status:** returns `articles` and `articlesCount`

---

### BUG-002 — Article `updatedAt` Never Changes

**Location:** `articles/models.py` → `Article.updated = models.DateTimeField(auto_now_add=True)`
**Django behaviour:** `updatedAt` is set once at creation and never updated when the article is edited. Uses `auto_now_add` instead of `auto_now`.
**Expected:** `updatedAt` should reflect the last modification time
**Preserved in NestJS during migration:** Yes
**Risk:** Consumers cannot rely on `updatedAt` to detect article edits
**Fix effort:** Low — change `@default(now())` to `@updatedAt` in Prisma schema + migration
**Tracking:** Resolved in post-migration cleanup
**Current NestJS status:** `updatedAt` mutates on article updates

---

## Future Cleanup Candidates (post-migration)

| ID      | Description                              | Effort | Phase to fix |
|---------|------------------------------------------|--------|--------------|
| CLEAN-001 | Add `articlesCount` to list responses  | Low     | Post Phase 7 |
| CLEAN-002 | Standardise pagination (limit/offset)  | Medium  | Post Phase 7 |

---

## Post-Migration Cleanup Applied

### [2026-06-12] BUG-001 Fix - Feed keys normalized

**Original (Django):** `GET /api/articles/feed` returned `{ comments, articleCount }`.
**Changed to:** NestJS now returns `{ articles, articlesCount }`.
**Reason:** Align with RealWorld contract shape and remove legacy key mismatch.
**Files affected:** `src/articles/articles.service.ts`, `test/contracts/articles.contract.spec.ts`
**Implementation status:** Implemented

### [2026-06-12] BUG-002 Fix - Article `updatedAt` now mutates on edit

**Original (Django):** `updatedAt` remained frozen after article updates.
**Changed to:** Prisma `Article.updatedAt` now uses `@updatedAt`, so edit operations refresh timestamp.
**Reason:** Restore expected update metadata behavior for consumers.
**Files affected:** `prisma/schema.prisma`, `test/contracts/articles.contract.spec.ts`
**Implementation status:** Implemented
