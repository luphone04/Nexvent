import { execFileSync } from 'node:child_process'
function run(args, env = process.env) { execFileSync('npx', args, { stdio: 'inherit', env }) }
run(['prisma', 'generate'])
// Previews share the portfolio database. Only production applies migrations;
// use Neon's direct connection for session-scoped migration advisory locks.
if (process.env.VERCEL_ENV !== 'preview') {
  run(['prisma', 'migrate', 'deploy'], {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  })
}
if (process.env.SEED_DEMO === 'true' && process.env.VERCEL_ENV === 'production') run(['tsx', 'prisma/seed.ts'])
run(['next', 'build'])
