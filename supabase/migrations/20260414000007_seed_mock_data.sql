do $seed$
declare
  v_demo_org uuid := '11111111-1111-1111-1111-111111111111';
  v_owner_id uuid := '22222222-2222-2222-2222-222222222222';
  v_member_id uuid := '33333333-3333-3333-3333-333333333333';
  v_owner_pw text := crypt('demo-owner-password', gen_salt('bf'));
  v_member_pw text := crypt('demo-member-password', gen_salt('bf'));
  v_owner_identity uuid := '22222222-2222-2222-2222-222222222201';
  v_member_identity uuid := '33333333-3333-3333-3333-333333333301';
begin
  if not exists (select 1 from public.orgs where id = v_demo_org) then
    raise exception 'organização demo % não encontrada; aplique primeiro a migração da org demo', v_demo_org;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_owner_id,
    'authenticated',
    'authenticated',
    'demo.owner@example.test',
    v_owner_pw,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dono Demo"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_member_id,
    'authenticated',
    'authenticated',
    'demo.member@example.test',
    v_member_pw,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Membro Demo"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    v_owner_identity,
    v_owner_id,
    v_owner_id::text,
    jsonb_build_object(
      'sub', v_owner_id::text,
      'email', 'demo.owner@example.test'
    ),
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    v_member_identity,
    v_member_id,
    v_member_id::text,
    jsonb_build_object(
      'sub', v_member_id::text,
      'email', 'demo.member@example.test'
    ),
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  update public.org_members
  set role = 'owner'
  where org_id = v_demo_org
    and user_id = v_owner_id;
end
$seed$;

insert into public.accounts (id, org_id, name, account_type, currency, external_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'Conta corrente operacional',
    'checking',
    'USD',
    'ext-chk-001'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    'Cartão corporativo',
    'credit',
    'USD',
    'ext-cc-002'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '11111111-1111-1111-1111-111111111111',
    'Reserva poupança',
    'savings',
    'USD',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    '11111111-1111-1111-1111-111111111111',
    'Receita de consultoria',
    'revenue',
    'USD',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    '11111111-1111-1111-1111-111111111111',
    'Despesas gerais',
    'expense_other',
    'USD',
    null
  )
on conflict (id) do nothing;

insert into public.categories (id, org_id, parent_id, name, code, kind)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Salários e folha',
    'INC-PAY',
    'income'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Instalações',
    'EXP-RENT',
    'expense'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'Aluguel',
    'EXP-RENT-01',
    'expense'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Software',
    'EXP-SW',
    'expense'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Transferência interna',
    'XFR',
    'transfer'
  )
on conflict (id) do nothing;

insert into public.transactions (
  id,
  org_id,
  account_id,
  category_id,
  amount_cents,
  currency,
  posted_at,
  description,
  memo,
  external_ref,
  status
)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    12500000,
    'USD',
    date '2026-03-01',
    'Retainer de cliente — Acme Co',
    'Fatura INV-2026-0142',
    'stripe_ch_abc123',
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    -420000,
    'USD',
    date '2026-03-03',
    'Pagamento de aluguel do escritório',
    'ACH do proprietário',
    'ach_rent_mar',
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    -18999,
    'USD',
    date '2026-03-05',
    'Assinaturas SaaS',
    'Cursor, GitHub, Vercel',
    null,
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
    -500000,
    'USD',
    date '2026-03-10',
    'Transferência para poupança',
    'Ajuste de fim de mês',
    'xfr-20260310',
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
    500000,
    'USD',
    date '2026-03-10',
    'Transferência da conta corrente',
    'Ajuste de fim de mês',
    'xfr-20260310',
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    null,
    -12550,
    'USD',
    date '2026-03-12',
    'Coffee break — workshop da equipe',
    null,
    null,
    'pending'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc7',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    -99900,
    'USD',
    date '2026-03-15',
    'Infraestrutura em nuvem',
    'Uso AWS em março',
    null,
    'posted'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc8',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    8750000,
    'USD',
    date '2026-04-01',
    'Retainer de cliente — Northwind',
    null,
    'wire_nw_apr',
    'posted'
  )
on conflict (id) do nothing;

insert into public.invoices (
  id,
  org_id,
  counterparty,
  issue_date,
  due_date,
  amount_cents,
  currency,
  status,
  number
)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '11111111-1111-1111-1111-111111111111',
    'Acme Indústria e Comércio',
    date '2026-03-25',
    date '2026-04-24',
    2500000,
    'USD',
    'sent',
    'INV-2026-0101'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '11111111-1111-1111-1111-111111111111',
    'Northwind Comércio',
    date '2026-04-01',
    date '2026-05-01',
    8750000,
    'USD',
    'paid',
    'INV-2026-0102'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    '11111111-1111-1111-1111-111111111111',
    'Contoso Ltda.',
    date '2026-04-05',
    date '2026-04-19',
    480000,
    'USD',
    'draft',
    'INV-2026-0103'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    '11111111-1111-1111-1111-111111111111',
    'Fabrikam S.A.',
    date '2026-03-10',
    date '2026-03-24',
    1200000,
    'USD',
    'void',
    'INV-2026-0099'
  )
on conflict (org_id, number) do nothing;

insert into public.balances (id, org_id, account_id, as_of_date, amount_cents)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    date '2026-03-31',
    2158451
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    date '2026-03-31',
    -218999
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    date '2026-03-31',
    500000
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    date '2026-04-14',
    2082901
  )
on conflict (account_id, as_of_date) do update
set
  amount_cents = excluded.amount_cents,
  org_id = excluded.org_id;

insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, payload)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'fatura.criada',
    'invoice',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '{"number":"INV-2026-0101","status":"sent"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'transacao.lancada',
    'transaction',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '{"amount_cents":-420000}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    null,
    'saldo.instantaneo',
    'balance',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '{"as_of_date":"2026-03-31"}'::jsonb
  );
