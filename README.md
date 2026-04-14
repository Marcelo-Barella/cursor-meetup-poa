# Ledgerline — finance SaaS demo

Next.js (App Router) + Supabase Auth + Postgres with row-level security, editorial “ledger tape” UI, and a bulk TypeScript seeder for MCP-scale querying (50k–200k+ rows).

## Prerequisites

- Node 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (local stack or linked remote project)
- Optional: Docker MCP gateway per `.cursor/mcp.json` for tool demos

## Environment

Copy `.env.example` to `.env.local` for the web app:

```bash
cp .env.example .env.local
```

Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard (Settings → API).

For seeding, add:

- `DATABASE_URL` — Postgres connection string (local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`; hosted: use the pooler URI with `sslmode=require` if required).
- `SUPABASE_SERVICE_ROLE_KEY` — only used if you extend the seeder to call the REST API; the script currently uses direct SQL via `pg`.

Optional tuning in `.env.local`:

- `SEED_TOTAL_TRANSACTIONS` (default `150000`, clamped 50k–200k)
- `SEED_INVOICE_ROWS` (default `8000`)
- `SEED_AUDIT_ROWS` (default `20000`)

## Database reset and migrations

**Local Supabase**

```bash
supabase start
supabase db reset
```

`db reset` applies everything under `supabase/migrations/`, including the fixed demo org (`demo-corp`, UUID `11111111-1111-1111-1111-111111111111`), enums, tables, RLS, grants, and `search_transactions` RPC.

**Remote project**

```bash
supabase link --project-ref <your-ref>
supabase db push
```

## Seed data (50k–200k rows)

After migrations:

```bash
npm install
npm run db:seed
```

The script truncates demo-org financial rows, recreates accounts/categories, bulk-inserts transactions in batches of 2,000, then invoices, balances, and audit rows. Progress prints to stdout.

## Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign up or sign in. New users are added to `profiles` and linked to the demo org via the `handle_new_user` trigger so RLS allows reads without a separate invite step.

## Pages

- `/dashboard` — counts, open invoice exposure, recent lines, audit tail
- `/ledger` — paginated transactions
- `/search` — full-text search via `search_transactions` (GIN on generated `tsvector`)

## Schema (Postgres)

| Table           | Purpose                                      |
|-----------------|----------------------------------------------|
| `orgs`          | Tenant                                       |
| `org_members`   | User ↔ org membership (RLS driver)         |
| `profiles`      | Display name keyed by `auth.users.id`        |
| `accounts`      | GL / bank style accounts                     |
| `categories`    | Hierarchical classification                  |
| `transactions`  | Ledger lines + generated search vector       |
| `invoices`      | AR-style documents                         |
| `balances`      | Point-in-time balances per account           |
| `audit_log`     | Append-only style events                     |

## Agent notes

See `AGENTS.md` (Next.js version quirks) and `CLAUDE.md` (where queries and seeding live).
