# Student onboarding

## Journeys and completion

One student account can change its starting goal without losing profile data or its private idea. Join a team: goal → personal skills → interests/time → review. Build an idea: goal → private idea → personal skills → interests/time → collaborator needs → review. Save each submitted step before advancing. Save and exit persists incomplete input separately in the database and stays on the current step when resumed. Back navigation preserves submitted data; unsubmitted edits are kept while the wizard is mounted.

Both paths require one personal skill with an explicit level, one sector, and one weekly time band. Learning/Practising/Experienced map to BEGINNER/INTERMEDIATE/ADVANCED; legacy EXPERT values remain intact. The idea path also requires a problem, target audience, venture sector, at least one required collaborator skill, and a contribution description. Title is optional for private completion and required for publication. No evidence uploads or weighted matching are included.

Completion explains the discoverable fields and defaults the visibility choice to on with an opt-out. Incomplete profiles are hidden regardless of the stored visibility flag. Email, private drafts and credentials are never part of discovery responses. Publication is separately explicit and exposes the recruitment brief plus the owner's name, including when the student's profile is hidden. Draft API reads always require ownership. Signed-in students can browse published opportunities without finishing onboarding.

## Catalogue manifest and reconciliation

`prisma/catalogues/existing-skills.json` preserves the 43 exported skills. `prisma/catalogues/onboarding.ts` adds 42 skills in 11 categories, 12 broad sectors, and four availability options. Categories never gate a student's choices by programme. All runtime pickers use database records. Programmes were already populated: the read-only live census on 2026-11-08 confirmed 109 active Kumasi entries, seven skill families and 43 skills matching the export. No programme seed is necessary for this database.

Sector slugs and IDs are preserved while labels broaden:

| Established slug | Label |
| --- | --- |
| technology | Technology |
| agritech | Food & Agriculture |
| fashion-design (new) | Fashion & Design |
| retail-commerce | Business & Retail |
| education | Education |
| health-biotech | Health & Wellbeing |
| media-creative | Media & Entertainment |
| clean-energy | Environment & Energy |
| manufacturing | Manufacturing & Construction |
| logistics-mobility | Transport & Logistics |
| hospitality-tourism (new) | Hospitality & Tourism |
| social-impact | Community & Social Impact |

AI & Data → Technology; Fintech → Business & Retail. The repeatable seed repoints existing selections/venture references and marks these two narrow sectors LEGACY without deleting their records. Existing duplicate names abort the seed for explicit reconciliation. Existing skill IDs, statuses, and programme strings are preserved. Custom names use Unicode NFKC, collapsed whitespace and lowercase for uniqueness; punctuation remains meaningful (C, C# and C++ are distinct). Custom skills become immediately selectable with creator attribution; similar search results are suggestions, never automatic fuzzy merges.

## Database and HTTP contract

Profile additions: goal and unique onboarding venture reference. Skill additions: unique nullable normalized name (backfilled before runtime use) and nullable creator relation. Venture additions: recruitment contribution and weekly hours (independent of commitment enums). Availability options are database records. New incomplete profiles default hidden.

All responses are private/no-store. Onboarding and discovery require a student session. Mutation routes require same-origin requests. Payloads are validated with Zod; identity/ownership never comes from JSON.

| Interface | Behaviour |
| --- | --- |
| GET /api/programmes | Public active Kumasi programme names for registration |
| GET /api/onboarding | Own saved state and active catalogues |
| PUT /api/onboarding/steps | `{data: {step, ...fields}, advance}`; Continue validates and saves canonical data, save/exit preserves incomplete input |
| POST /api/onboarding/skills | `{name, familyId, proficiency}`; atomically create/reuse and attach a skill |
| POST /api/onboarding/complete | `{discoverability, publish}`; transactionally validate, finish and optionally publish the owned onboarding venture |
| GET /api/auth/destination | Incomplete setup → /onboarding; completed JOIN_TEAM → /explore; completed BUILD_IDEA → /ventures; other roles return home |
| GET /api/students | Only completed, opted-in public profile fields |
| GET /api/ventures | Published recruitment briefs only |
| GET /api/ventures/:id | Own draft or published brief; other drafts return 404 |
| PATCH /api/ventures/:id | Owner-only draft title update before later publication |
| POST /api/ventures/:id/publish | Explicit owner-only publication, validated against the full brief and completed profile |

Invalid input returns 400; no session 401; wrong role/origin 403; missing/non-owned draft 404; incompatible state or retired reference 409; database/service failures 503 with retryable wording. Completion and publication are idempotent. Step writes are refused once onboarding completes; completed students edit their profile separately at `/profile/edit`. See `student-applications.md` for optional introductions and venture application continuation.

## Deployment and verification

This repository had no migration history. The additive SQL migrations `202611080001_student_onboarding`, `202611080002_onboarding_drafts`, and `202611090001_idea_text_limits` are reviewed deltas against the starting schema, not initial migrations. Apply each once in order with `prisma db execute`, then run `db:seed:onboarding`. The second migration recreates the normalized-name index around a binary collation change because TiDB cannot change an indexed column's collation in place. The third widens idea problem/audience columns to support their 500/300-character form limits without losing existing data. Do not run `migrate deploy` against an unbaselined existing database. For another database, provision the full schema and programme catalogue before seeding. Run the census before/after and repeat the seed to verify idempotency.

Validate both paths, resume/back/switching, private finish/publish, opt-out, duplicates/concurrent skill creation, inactive IDs, unauthorized access, transactional failures, and idempotent completion. Run auth and onboarding tests, typecheck, lint, build, and browser checks at desktop/mobile sizes. No fabricated trends, venture counts or match scores appear in onboarding.

`pnpm test:auth` uses the in-memory auth adapter. `pnpm test:onboarding` uses the configured database, creates uniquely named temporary accounts/skills/ventures, and removes them in `finally`. Its ten-minute ceiling accommodates remote database round trips across both journeys; progress checkpoints identify the completed boundaries. Browser evidence is saved under `outputs/onboarding-verification` (Edge, 1440×1000 desktop and 390×844 mobile).

Registration validates programme membership before entering its transaction and creates both profiles inside the transaction. Prisma's transaction timeout is 30 seconds to accommodate the remote database. Restart a running dev server after regenerating Prisma: its global client can otherwise retain the previous schema. Onboarding query caches and editor instances are scoped to the authenticated user ID; logout cancels queries and clears cached private data.

### Verification recorded on 9 November 2026

- Applied all three additive migrations and repeated the seed successfully. Live catalogue: 85 skills, 11 categories, 12 active sectors, four availability choices, 109 active Kumasi programmes; no skills lack a normalized key.
- Four in-memory auth tests passed. The live onboarding suite passed twice, including draft recovery, goal changes, concurrent skill creation, discovery opt-out, owner authorization, private completion and later publication.
- Automated Edge checks passed for desktop registration → join-team completion and mobile idea setup → partial save/resume → recruitment preview → confirmed publication. Both viewports had no horizontal overflow or page errors. An injected catalogue failure recovered through Retry; logout revoked authenticated onboarding access.
- Later live suite reruns encountered intermittent connection-pool acquisition failures (`active=0 idle=0 limit=5`); one run also exceeded its original four-minute total limit. The final live rerun passed registration/join checks and then failed acquiring a connection during an idea state read. Full final live-suite green status remains unverified; rerun `pnpm test:onboarding` with reliable database connectivity.
- No deployment was performed. Matching, messaging, trials and catalogue administration remain outside this implementation. Profile editing and student-initiated applications were subsequently added; see `student-applications.md`.
