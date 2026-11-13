# VentureMatch

**Connect Skills. Build Ventures.**

VentureMatch helps current USTED Kumasi students find collaborators across disciplines, combine complementary skills, and develop early ventures. One student account supports both starting an idea and joining a team.

The intended experience takes students from discovering people and ventures to agreeing on a group trial, trying work together, and continuing as a team. Matching should explain how a student's capabilities, interests, availability, and working preferences fit a particular venture's needs.

## Project status

This is the new application rebuild. The current foundation includes:

- Next.js App Router with React and TypeScript.
- Tailwind CSS and shadcn/ui using the Maia style and Base UI.
- Plus Jakarta Sans, VentureMatch brand colors, and a light theme baseline.
- Shared React Query, theme, tooltip, and toast providers.
- VentureMatch metadata, icons, and web manifest.
- An introspected MySQL schema, a server-only Prisma client, and a database connection check.

The database connection check has passed against the configured database. The app includes Better Auth email/password sign-in, student onboarding, signed-in discovery, and venture applications. See [venture management, recruitment and group trials](docs/venture-recruitment-trials.md) for the migration, deadline worker, and transactional email setup.

## Product and design references

- [Design and experience guide](../Resources/DESIGN.md): product direction, visual identity, journeys, privacy boundaries, and accessibility requirements.
- [Redesign documentation](../Resources/Redesign/README.md): screen catalogue, decisions, and design prompts.
- [Archived application](https://github.com/Masood-zone/venturematch): historical implementation reference.

The design references live in the parent workspace's `Resources` directory; those links require that directory to be present. The archived implementation and existing database schema provide context, while current product decisions govern the rebuild.

## Technology

| Area | Current setup |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui Maia, Base UI |
| Typography | Plus Jakarta Sans through `next/font/google` |
| Client data cache | TanStack React Query |
| Feedback | Sonner notifications and shared tooltips |
| Database | MySQL-compatible database with Prisma 7 and `@prisma/adapter-mariadb` |
| Package manager | pnpm 11.12.0 |

The active database client uses the MySQL/MariaDB adapter. PostgreSQL packages remain installed but are not used by `lib/db.ts`.

## Local setup

Use Node.js 24 LTS and the pnpm version declared in `package.json`. Run the following commands from this application's root directory.

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Create a root `.env` with the database connection supplied by the project owner:

   ```dotenv
   DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
   ```

   Replace the placeholders with the actual connection details and URL-encode special characters in credentials. Keep provider-required TLS options in the connection URL. The runtime client also explicitly enables TLS certificate verification in `lib/db.ts`; providers requiring a custom CA need that configured there.

   `.env` files are ignored by Git. Keep `DATABASE_URL` server-only and never prefix it with `NEXT_PUBLIC_`.

3. Generate the Prisma client from the checked-in schema:

   ```sh
   pnpm exec prisma generate --config prisma7.config.ts
   ```

   Generated files are written to `lib/generated/prisma` and ignored by Git. Generate them after installation and whenever the Prisma schema changes. Generation is currently a manual command, not a package lifecycle script.

4. Check the database connection:

   ```sh
   node --conditions=react-server --import=tsx scripts/check-db.ts
   ```

   Expected output: `Database connection successful.` The script loads `.env`, runs a read-only `SELECT 1`, accepts either a number or bigint response, and closes the connection. The `react-server` condition allows the standalone script to import the server-only database module.

5. Start development:

   ```sh
   pnpm dev
   ```

   Open [localhost:3000](http://localhost:3000).

## Database workflow

Prisma configuration currently lives in **`prisma7.config.ts`**, so pass `--config prisma7.config.ts` explicitly to Prisma commands.

Validate the local schema:

```sh
pnpm exec prisma validate --config prisma7.config.ts
```

When intentionally refreshing the local schema from the existing database:

```sh
pnpm exec prisma db pull --config prisma7.config.ts
pnpm exec prisma generate --config prisma7.config.ts
```

`db pull` reads database structure and updates the local schema. Review that schema change before using the regenerated client. Connecting an existing database does not require `db push`, a reset, seeding, or replaying archived migrations. Plan schema changes and migration history separately before applying database writes.

Use the shared `db` export from `lib/db.ts` in server components, route handlers, server actions, or server-side services. Client components and React providers must not import the database client. Use the shared authentication and authorization services to protect feature-specific access to data.

## Validation and production commands

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

`pnpm start` serves the output of a successful production build. Use `pnpm test:auth`, `pnpm test:applications`, `pnpm test:dashboards`, and `pnpm test:trials` for local regressions. Use a disposable database for the onboarding and venture integration suites.

## Project structure

```text
app/                         Routes, root layout, global styles, and metadata
components/providers/        Shared client-side providers
components/ui/               UI primitives
lib/db.ts                    Shared server-only database client
lib/generated/prisma/        Generated Prisma client (ignored)
prisma/schema.prisma         Database models
prisma7.config.ts            Prisma CLI configuration
public/                      Logos, icons, and web manifest
scripts/check-db.ts          Read-only runtime connection check
```

## Interface direction

Use navy `#0B1D3A` for primary actions, teal `#0AA08A` for brand accents, darker teal `#006B5B` for readable functional accents, and pale gray `#F3F6F9` for the canvas. The baseline is light, with generous whitespace, readable typography, and restrained rounding.

Follow the design guide for keyboard access, visible focus, responsive layouts, and loading, empty, error, and success states. Sample content must be identified as sample data, and success messages must reflect confirmed operations.
