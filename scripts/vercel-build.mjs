import { execFileSync } from 'node:child_process'
function run(args) { execFileSync('npx', args, { stdio: 'inherit', env: process.env }) }
run(['prisma', 'generate'])
run(['prisma', 'migrate', 'deploy'])
if (process.env.SEED_DEMO === 'true' && process.env.VERCEL_ENV === 'production') run(['tsx', 'prisma/seed.ts'])
run(['next', 'build'])
