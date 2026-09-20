# Vercel portfolio deployment

The public site is https://nexvent-rust.vercel.app. Next.js serves both the UI and API on Vercel Hobby. The separate `nexvent-portfolio` Neon Free database stores accounts, events, registrations, and small re-encoded avatars. Both services run in the US East region. No Azure services or recovered Azure data are required.

## Local development

Use Node.js 22 and PostgreSQL. Copy `.env.example` to `.env.local`, supply a local `DATABASE_URL` and a random `NEXTAUTH_SECRET`, then run:

```sh
npm ci
npx prisma migrate deploy
npm run seed
npm run dev
```

Prisma CLI and `tsx` do not automatically load Next.js `.env.local`; export `DATABASE_URL` before running migrations or seeding, or use a local `.env` file. Never commit either file.

## Hosting configuration

`vercel.json` selects `npm run vercel-build`. That script generates Prisma, applies existing migrations, optionally seeds missing demo records in production when `SEED_DEMO=true`, and builds Next.js. Seeding preserves existing records; it does not reset visitor edits or refresh event dates.

Required production environment variables:

- `DATABASE_URL`: Neon pooled connection, supplied by the approved Vercel integration.
- `NEXTAUTH_SECRET`: generated private signing secret.
- `NEXTAUTH_URL`: `https://nexvent-rust.vercel.app`.
- `SEED_DEMO`: `true` for idempotent fixture creation during production builds.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: optional private owner account. Password must contain at least 16 characters. These only create a missing account; changing them does not reset an existing password.

The owner's generated credentials are stored locally in ignored `.env.owner.local` with owner-only permissions. Do not upload or commit it. Vercel stores production values as sensitive variables. Sensitive values cannot be recovered with `vercel env pull`.

Preview deployments currently use the same demo database by explicit approval. Use a separate Neon branch before testing destructive schema changes. Seed runs only for production. A separate signing secret is configured for previews; Vercel supplies the deployment hostname when `NEXTAUTH_URL` is absent.

## Behavior and constraints

- The app runs at `/`; old `/nexvent/*` paths redirect to their root equivalents.
- Event form times are UTC. Check-in opens 24 hours before the event and closes 24 hours after the start because this schema has no end timestamp.
- Public demo accounts are shared. Use fictional information only. Private admin access is separate.
- All newly created events are free. Email delivery and payment processing are intentionally disabled, and the UI makes this explicit.
- Avatars accept JPEG/PNG/WebP up to 2MB and are decoded, resized to 256×256, and re-encoded as WebP up to 50KB. They persist in PostgreSQL instead of Vercel's ephemeral filesystem.
- Free tiers have usage limits and can pause or throttle; they do not provide an uptime guarantee. Neon can introduce a cold-start delay. Check the Vercel and Neon dashboards for current usage.
- Camera scanning requires HTTPS and browser camera permission. Manual code entry remains available. Physical camera scanning must be checked on the target phone.
- Demo event dates are relative to the first seed. Create new events through the organizer account as they age.

## Validation

Run `npm run lint`, `npx tsc --noEmit --incremental false`, and `npm run build`.

`tests/migration-regression.mjs` runs 24 integration checks against a disposable local database and a running production build at port 3100. It refuses remote targets, creates isolated users/events, and removes its own fixtures afterward:

```sh
TEST_BASE_URL=http://127.0.0.1:3100 node tests/migration-regression.mjs
```

These checks cover authentication, draft privacy, pagination validation, concurrent capacity allocation, notes permissions, server pages, cancellation/waitlist promotion, event-bound check-in, profile privacy, and admin session revocation. The earlier `codebase-review.md` describes pre-migration findings, not the status of the deployed version.

Dependency validation: Next.js 15.5.25, patched React 19, and Prisma 6.19.3. PostCSS 8.5.28 and deepmerge-ts 8.0.2 overrides resolve inherited advisories; Prisma generation/migrations and the production build validate compatibility. npm audit reports zero known vulnerabilities at migration time.
