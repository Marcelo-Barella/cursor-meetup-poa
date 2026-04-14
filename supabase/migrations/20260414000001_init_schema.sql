create extension if not exists "pgcrypto";

create type public.account_type as enum (
  'checking',
  'credit',
  'savings',
  'revenue',
  'expense_other'
);

create type public.category_kind as enum ('income', 'expense', 'transfer');

create type public.invoice_status as enum ('draft', 'sent', 'paid', 'void');

create type public.transaction_status as enum ('pending', 'posted', 'void');

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  account_type public.account_type not null default 'checking',
  currency char(3) not null default 'USD',
  external_id text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  code text,
  kind public.category_kind not null default 'expense',
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  posted_at date not null,
  description text not null default '',
  memo text,
  external_ref text,
  status public.transaction_status not null default 'posted',
  search_vector tsvector generated always as (
    to_tsvector(
      'portuguese',
      coalesce(description, '') || ' ' || coalesce(memo, '') || ' ' || coalesce(external_ref, '')
    )
  ) stored,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  counterparty text not null,
  issue_date date not null,
  due_date date not null,
  amount_cents bigint not null,
  currency char(3) not null default 'USD',
  status public.invoice_status not null default 'draft',
  number text not null,
  created_at timestamptz not null default now(),
  unique (org_id, number)
);

create table public.balances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  as_of_date date not null,
  amount_cents bigint not null,
  created_at timestamptz not null default now(),
  unique (account_id, as_of_date)
);

create table public.audit_log (
  id bigserial primary key,
  org_id uuid not null references public.orgs (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_org_members_user on public.org_members (user_id);
create index idx_accounts_org on public.accounts (org_id);
create index idx_categories_org on public.categories (org_id);
create index idx_transactions_org_posted on public.transactions (org_id, posted_at desc);
create index idx_transactions_org_account on public.transactions (org_id, account_id);
create index idx_transactions_search on public.transactions using gin (search_vector);
create index idx_invoices_org on public.invoices (org_id);
create index idx_balances_org on public.balances (org_id);
create index idx_audit_log_org_created on public.audit_log (org_id, created_at desc);

create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_org uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  select id into demo_org from public.orgs where slug = 'demo-corp' limit 1;
  if demo_org is not null then
    insert into public.org_members (org_id, user_id, role)
    values (demo_org, new.id, 'member')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
