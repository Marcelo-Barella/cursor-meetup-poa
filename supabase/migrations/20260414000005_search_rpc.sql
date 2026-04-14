create or replace function public.search_transactions(
  p_org_id uuid,
  p_query text,
  p_limit int default 50
)
returns setof public.transactions
language sql
stable
security invoker
set search_path = public
as $$
  select t.*
  from public.transactions t
  where t.org_id = p_org_id
    and (
      p_query is null
      or length(trim(p_query)) = 0
      or t.search_vector @@ websearch_to_tsquery('portuguese', p_query)
    )
  order by t.posted_at desc, t.id
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.search_transactions(uuid, text, int) to authenticated;
