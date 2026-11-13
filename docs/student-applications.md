# Student applications and profile editing

The homepage’s two starting points carry an explicit goal through registration and sign-in. Incomplete students resume saved onboarding; a new setup preselects the entry goal. An existing saved goal or private idea is not overwritten. Completed students choosing Find a team open Explore, including students whose original goal was BUILD_IDEA. Ordinary sign-in still follows the saved goal.

Opening a signed-in venture URL retains its ID through authentication. Choosing Complete your profile to apply retains the venture through onboarding and returns to its brief without submitting anything. Continuation accepts only known goals and bounded opaque venture IDs, never arbitrary redirect URLs.

Completed students can edit skills, proficiency, interests, availability, discoverability and optional contribution/team introductions at `/profile/edit`, linked from Explore and the account menu. Editing preserves the onboarding goal, completion and private idea. New introductions are optional for existing accounts and are not added to directory responses. The existing self-reported Expert level can be preserved but cannot be newly assigned. Incomplete students use onboarding instead.

## Applying and reviewing

An applicant must be a signed-in student with completed onboarding. Only ACTIVE ventures accept applications; owners and active members cannot apply. Submission requires a trimmed 1–2,000-character message and explicit consent to share the application profile. The server snapshots name, programme, skills/levels, sector interests, availability and optional introductions. Email, private ideas and other user fields are excluded. Applying with a hidden profile shares this snapshot only with the owner; it does not change discoverability.

There is one application per venture/student pair. Duplicate pending submissions return the existing request. Applicants can withdraw pending requests and resubmit withdrawn ones. Declined and accepted requests cannot be resubmitted or reversed. The row stores the latest submission, not a historical activity log. Owners review applications in their venture’s details; applicants track them under My Ventures.

Owners approve or decline pending applications. Approval requires an active venture and atomically creates/reactivates ACTIVE TEAM_MEMBER membership. It does not start a trial. Same-decision retries are idempotent; conflicting terminal decisions fail. Pending requests to inactive ventures can still be withdrawn or declined. Repeating an accepted decision does not reactivate a membership that has subsequently left. Existing owner-sent invitations are separate and unchanged.

All application mutations lock the venture row inside a transaction. Profile saves lock the student profile. A unique venture/applicant key and the existing unique membership key enforce record uniqueness. Authorization is checked server-side; application snapshots are readable only by the applicant or venture owner. All API responses use private/no-store caching, and mutations require student authentication, same-origin JSON and boundary validation.

| Endpoint | Contract |
| --- | --- |
| GET /api/me/profile | Own onboarding/profile state and catalogues |
| PUT /api/me/profile | Skills with levels, sectorIds, weeklyHoursBand, discoverability, contributionIntro, teamGoals; completed students only |
| POST /api/onboarding/complete | Existing completion fields plus optional contributionIntro/teamGoals |
| POST /api/ventures/:id/applications | `{message, shareProfile: true}`; returns submitted/existing pending application |
| GET /api/ventures/:id/applications | Owner-only application list |
| PATCH /api/ventures/:id/applications/:applicationId | `{action: "approve" \| "decline" \| "withdraw"}`; checks actor and current state |
| GET /api/me/applications | Own application list |

Application responses expose IDs, venture name/active state, PENDING/ACCEPTED/DECLINED/WITHDRAWN status, submitted message/profile snapshot and ISO timestamps. Private venture details remain restricted to owners; an applicant can retain their application record after a venture stops being public. Missing records/foreign application access return 404, forbidden actor actions 403, incompatible state 409, invalid payloads 400, unauthenticated access 401 and unexpected service failures 503.

## Migration and verification

The additive migration `202611090002_venture_applications` adds nullable profile introduction columns and a separate application table. No backfill is needed. Apply it once after the three existing migrations, using the project’s established unbaselined-database procedure:

```powershell
pnpm exec prisma db execute --config prisma7.config.ts --file prisma/migrations/202611090002_venture_applications/migration.sql
pnpm db:generate
```

Do not use `migrate deploy` against the existing unbaselined database. The migration was applied to the configured database on November 11, 2026. A read-only check confirmed that all 50 Prisma model tables exist and that Prisma can query `venture_application` and both profile introduction columns. Other databases require this migration before running the application. Restart a running development server after updating its generated Prisma client.

`pnpm test:applications` runs application and profile regression tests using isolated transactional adapters, with no remote database access. Tests cover safe entry destinations, legacy optional fields, consent, hidden-profile snapshots, access controls, duplicate submissions/approvals, withdrawal/resubmission, inactive ventures, terminal decisions, membership reactivation, profile preservation and rollback. Adapter concurrency/rollback tests exercise service behavior; they do not establish live TiDB locking or database rollback behavior.

Additional local checks include `pnpm test:auth`, `pnpm test:dashboards`, `pnpm typecheck`, `pnpm lint`, and Prisma schema validation. The live schema check covered reads. Manual verification still covers applicant submission, owner approval, Joined ventures, decline and withdrawal, profile editing, and mobile and keyboard layout.
