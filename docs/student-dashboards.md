# Student dashboards

Completed students land on `/explore` for JOIN_TEAM and `/ventures` for BUILD_IDEA. Missing or unrecognized completed goals default to Explore. Incomplete students continue onboarding from sign-in; both dashboards remain available to browse, with a resume prompt. Goals affect the starting page, not permissions. `lib/student-destination.ts` owns this routing rule for auth continuation, the destination API, and onboarding completion (including idempotent retries).

## Interfaces

- Explore follows the Main Explore e01 reference. Search by title, problem, or required skill; combine sector and weekly-availability filters through `q`, `sector`, and `hours` URL parameters. Repeated parameters use the first value; search is trimmed and limited to 120 characters, IDs to 191. Filtering runs in Prisma before the latest-100 limit, with an explicit notice at the limit. Only ACTIVE ventures are discoverable, with no sample records, match scores, or verification claims.
- My Ventures follows Main MyVentures v01. Owner records are split into non-drafts and private drafts. Joined records require an ACTIVE membership, exclude owner duplicates and other owners' drafts, and display actual membership counts. Nonpublic joined records have summaries but no detail link. This page does not grant additional draft or venture-detail access.
- Both pages use the shared student header, account menu and mobile navigation. Cards link to the existing venture brief and owner-only draft publication workflow. Owners return from their brief to My Ventures; other viewers return to Explore.

Server components load session-scoped data without shared caching. The existing student guards and publication validation remain in place. No schema change, migration, deployment, new creation workflow, matching, recruitment, messaging, or trial action is included.

## Checks

`pnpm test:dashboards` runs local routing, URL-input and query-scope regression checks without database access. `pnpm test:auth` uses the existing in-memory adapter. The existing live `test:onboarding` suite also asserts BUILD_IDEA's completion, repeat-completion and destination-API results; running it creates temporary database records and is separate from local validation.

## Student application extension

Explicit homepage goals can override the starting destination without changing the saved onboarding goal. Find a team resumes unfinished setup or opens Explore for completed students. Venture details now support applications and owner review, with atomic membership creation on approval. My Ventures includes applicant status and pending-review links for owned ventures. See `student-applications.md` for interfaces, privacy, migration prerequisites and verification limits.
