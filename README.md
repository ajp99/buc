# Tuition Class Web App

Next.js 15 + Tailwind + shadcn/ui + Supabase. See the build plan for scope and decisions.

## Dev
```
cp .env.example .env.local   # fill in Supabase values
npm run dev
npm run typecheck && npm run lint && npm test
npx supabase start           # local Supabase (needs Docker)
```

## Weekly export checklist (teacher)
- Supabase dashboard -> Table editor -> export each table as CSV (or run a SQL dump).
- Save the files to Google Drive. Supabase's own daily backups keep only 7 days.
