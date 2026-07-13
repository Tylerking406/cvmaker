# Session Notes — 2026-07-13

Handoff notes for continuing tomorrow. See `git log` on `claude/wip-8hdQe` for full commit detail; this is the "why" and "what's next" that doesn't show up there.

## What shipped this session

- **Edit/Save/Cancel** added to Experience, Education, Skills, Projects, Certifications, and Achievements — previously only Personal Info had an explicit Save; the rest only supported instant Add + Delete.
- **Validation & sanitization** across all forms: required fields, email/phone/URL format checks, date validity + ordering (end ≥ start, expiry ≥ issue), inline error messages, trimmed/deduped input before it hits the API.
- **Dropdowns**: Degree (Education) and Category (Skills) now use a `Select` with common presets + a custom "Other" fallback. Date fields switched to native `<input type="date">`.
- **UI retheme**: Slate & Emerald color palette (was indigo/violet), a profile-completeness checklist in the editor sidebar, and richer empty states for each section.
- **Broadened for a general (non-technical) audience**: this app is meant for everyone — teachers, security officers, retail staff, not just developers. Skills categories, Degree options, and every placeholder/example across the editor were tech-flavored ("React, TypeScript", "AWS Solutions Architect", "Software Engineer" as the example job title) and have been replaced with profession-neutral copy.
- **CV templates**: added a template picker (`/cv/[id]/template`) with three styles — Classic (the original), Modern (two-column sidebar), Minimal (clean single-column). Templates render from `components/cv-templates/`, selection persists via the existing (previously unused) `cv.template` field, and the picker shows live thumbnails using example content (`lib/cv-template-data.ts`) rather than the user's own possibly-empty data.

## Known gaps, flagged but not built (confirm before building)

- **No real multi-user auth.** The dashboard shares one hardcoded dev user (`dev@cvmaker.local`) across anyone hitting the app locally. This is the biggest real production-readiness gap if this goes in front of actual users.
- **No save/delete feedback** beyond spinners (toast notifications suggested, not built).
- **No reordering** for list entries — `orderIndex` exists on every entity but nothing in the UI lets you change it (drag-and-drop suggested).
- **Dashboard is bare** — no search/filter, no last-edited date, static "Draft" badge instead of a real completeness indicator.

## Environment gotcha

Port 3000 locally may be the *Docker Compose stack* (real `.NET` API + Postgres + a built, non-hot-reloading frontend), tunneled in via Rancher Desktop's Lima VM — not the `npm run dev` server, which shifts to 3001 if 3000 is taken. Check `lsof -i :3000` before assuming which one you're hitting.

## Branch state

`claude/wip-8hdQe` was force-pushed on 2026-07-13 after it diverged from another parallel Claude session's work on the same branch (a Kubernetes-manifests commit and a competing Edit/Save implementation) — both are still recoverable from GitHub's reflog if needed, but are no longer on this branch.
