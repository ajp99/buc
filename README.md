# Tuition Class Web App

Next.js 15 + Tailwind + shadcn/ui + Supabase.

## Local setup
```
npx supabase start          # local Supabase in Docker (ports 5542x)
cp .env.example .env.local  # fill from `npx supabase status -o env`, set SEED_ADMIN_PASSWORD
npx supabase db reset       # apply migrations
npm run seed:admin          # first admin account (username from SEED_ADMIN_USERNAME)
npm run seed:dev            # local fixtures: students 9000000006 (std 6), 9000000009 (std 9), co-teacher "coteacher"; password devpass1234
npm run dev
```

## Checks
```
npm run typecheck && npm run lint && npm test   # unit tests
npm run test:db                                 # pgTAP RLS tests against local Supabase
npm run build && npm run test:e2e               # Playwright against a production build on :3100
npm run db:types                                # regenerate lib/supabase/database.types.ts after schema changes
```

## Logins
- Students/parents: phone number + password (set by the admin).
- Admin and co-teacher: username + password.

## Weekly export checklist (teacher)
- Supabase dashboard -> Table editor -> export each table as CSV (or run a SQL dump).
- Save the files to Google Drive. Supabase's own daily backups keep only 7 days.
