insert into public.orgs (id, name, slug)
values (
  '11111111-1111-1111-1111-111111111111',
  'Empresa Demo',
  'demo-corp'
)
on conflict (slug) do nothing;
