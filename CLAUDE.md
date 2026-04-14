# Claude / agent notes

- Next.js App Router: server components fetch with `createSupabaseServerClient()` from `src/lib/supabase/server.ts`.
- Auth: middleware refreshes session; `(app)` layout requires a user.
- Data: `src/lib/data/finance.ts` centralizes org-scoped queries; RLS applies to the anon key in the browser and server.
- Bulk data: run `npm run db:seed` with `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS via direct Postgres).
- Demo org slug: `demo-corp` (fixed UUID in migrations). New auth users receive membership via `handle_new_user` trigger.
