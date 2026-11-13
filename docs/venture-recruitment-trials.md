# Venture management, recruitment and group trials

Apply the additive migration on a disposable TiDB database first. The existing project database is unbaselined. Use the same one-time migration procedure as student applications.

```powershell
pnpm exec prisma db execute --config prisma7.config.ts --file prisma/migrations/202611120001_venture_recruitment_trials/migration.sql
pnpm db:generate
```

Existing drafts, applications, trial rows and memberships keep their IDs. The migration gives existing drafts an editor start step. The new lifecycle uses an additive state record and immutable plan versions alongside each new founder trial. Legacy founder trials are excluded from the new workspace.

## Deadline worker and email

Run `pnpm venture:worker --watch` as a managed service for a pass every 15 minutes, or schedule the one-shot `pnpm venture:worker` at that interval. Use Node.js 24 and the same database and authentication origin as the web process. The worker opens due reviews, sends one reminder halfway through the 72-hour window, closes expired trials, and processes a batch of queued emails. Trial detail and mutations also check deadlines. All times are UTC.

Set `VENTURE_EMAIL_DELIVERY=true` on the worker after testing with controlled inboxes and configuring SMTP. While disabled, email events accumulate in the outbox. Before enabling it on a database with old events, inspect the pending rows and set `cancelledAt` on obsolete rows so the worker only sends current notices. Use the existing SMTP settings and a `BETTER_AUTH_URL` that recipients can reach. The web process commits each email event alongside its trial or invitation change.

The worker retries transient failures up to five attempts with exponential backoff. Check worker exit codes and rows with `failedAt` set. `failureCode` gives a sanitized delivery status. Successful delivery marks `sentAt`. Reminders for already-submitted, withdrawn, or expired reviewers are cancelled before the worker sends them. A retry after an ambiguous SMTP response can produce a duplicate email.

## Verification

Run `pnpm test:trials` for local checks of UTC boundaries, review resolution, reminder recipients, notice deduplication, safe sign-in destinations and email rendering. Run `pnpm test:venture-integration` and `pnpm test:onboarding` with a disposable, migrated database and seeded catalogues. The venture integration test expects the database name to match `venturematch_qa_<digits>`. Test the worker on the same disposable database and use controlled recipients for SMTP verification.

For the browser journey, sign in as an owner, two discoverable candidates, and an unrelated student in separate sessions. Publish a draft, invite both candidates, accept interest, and exchange a private message. Propose and agree to a trial, start it on the agreed UTC day, assign and submit work, then submit private reviews and confirm Joined ventures. Repeat for withdrawals, expiry, an extension, and a revised roster. Check desktop and mobile layouts and direct private-link access from each account.
