alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.org_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.balances enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "orgs_select_member"
  on public.orgs for select
  using (id in (select public.user_org_ids()));

create policy "org_members_select_member"
  on public.org_members for select
  using (
    user_id = auth.uid()
    or org_id in (select public.user_org_ids())
  );

create policy "accounts_select_member"
  on public.accounts for select
  using (org_id in (select public.user_org_ids()));

create policy "categories_select_member"
  on public.categories for select
  using (org_id in (select public.user_org_ids()));

create policy "transactions_select_member"
  on public.transactions for select
  using (org_id in (select public.user_org_ids()));

create policy "transactions_insert_member"
  on public.transactions for insert
  with check (org_id in (select public.user_org_ids()));

create policy "transactions_update_member"
  on public.transactions for update
  using (org_id in (select public.user_org_ids()));

create policy "invoices_select_member"
  on public.invoices for select
  using (org_id in (select public.user_org_ids()));

create policy "balances_select_member"
  on public.balances for select
  using (org_id in (select public.user_org_ids()));

create policy "audit_log_select_member"
  on public.audit_log for select
  using (org_id in (select public.user_org_ids()));
