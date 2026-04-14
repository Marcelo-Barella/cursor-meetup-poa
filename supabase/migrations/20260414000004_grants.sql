grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update on public.transactions to authenticated;
grant insert, update on public.profiles to authenticated;
