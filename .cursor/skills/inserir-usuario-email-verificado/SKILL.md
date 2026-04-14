---
name: inserir-usuario-email-verificado
description: Insere usuário de autenticação com e-mail já confirmado no Postgres (Supabase Auth), incluindo identity de e-mail para login. Cobre SQL (migrações, psql, seeds) e Admin API em Node. Usar ao adicionar usuários, popular auth.users, corrigir contas de teste ou quando pedirem conta com e-mail verificado sem fluxo de confirmação.
---

# Inserir usuário com e-mail verificado

## Escopo

Fluxo típico em Postgres com Supabase: `auth.users` + `auth.identities` (provider `email`), com `email_confirmed_at` preenchido para equivaler a e-mail verificado.

Neste repositório existe o trigger `public.handle_new_user` em `auth.users`, que cria `public.profiles` e pode associar à org `demo-corp` em `public.org_members`. Prefira inserir em `auth.users` (ou `auth.admin.createUser` com confirmação), não só linha em `profiles`.

## Segurança

- Alterar `auth.*` exige privilégio elevado (SQL como superusuário / executor de migração, ou `SUPABASE_SERVICE_ROLE_KEY` na Admin API). Nunca usar service role no browser nem em variáveis `NEXT_PUBLIC_*`.
- Usar só em local, CI ou fluxos admin controlados, salvo pedido explícito para produção.

## Método A: SQL (alinhado a `supabase/migrations/20260414000007_seed_mock_data.sql`)

Executar em migração, pipeline de `supabase db reset`, ou `psql` com privilégios suficientes.

1. Garantir `pgcrypto` (`crypt` para senha).
2. Escolher UUIDs estáveis: `v_user_id` para `auth.users.id`, `v_identity_id` para `auth.identities.id` (sem colisão).
3. `instance_id`: no Supabase local usar `'00000000-0000-0000-0000-000000000000'`. Em projeto hospedado, reutilizar o id da instância: `select instance_id from auth.users limit 1`.
4. Definir `email_confirmed_at` com timestamp UTC não nulo (ex.: `timezone('utc', now())`).
5. Inserir em `auth.users` e depois em `auth.identities` com provider `email`.

Modelo (substituir placeholders):

```sql
do $block$
declare
  v_user_id uuid := '<USER_UUID>';
  v_identity_id uuid := '<IDENTITY_UUID>';
  v_email text := '<EMAIL>';
  v_pw text := crypt('<PLAIN_PASSWORD>', gen_salt('bf'));
begin
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
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_pw,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', '<DISPLAY_NAME>'),
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
    v_identity_id,
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;
end
$block$;
```

Campos de token como string vazia espelham o seed do projeto; ajuste se a versão do Supabase exigir outros padrões.

## Método B: Admin API do Supabase (Node / scripts de seed)

Usar `@supabase/supabase-js` com `SUPABASE_SERVICE_ROLE_KEY` e cliente de serviço:

1. `createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })`
2. `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: '...' } })`

Grava `auth.users` com e-mail confirmado e cria a identity; triggers do banco (ex.: perfil) seguem aplicáveis.

## Verificação

- `select id, email, email_confirmed_at from auth.users where email = '<EMAIL>';` — `email_confirmed_at` deve estar preenchido.
- `select * from auth.identities where user_id = '<USER_UUID>' and provider = 'email';` — deve existir linha.
- `select * from public.profiles where id = '<USER_UUID>';` — se houver trigger neste projeto, deve existir linha.

## Referências

- Lista de colunas e valores demo: [migração de seed](../../../supabase/migrations/20260414000007_seed_mock_data.sql)
- Trigger pós-insert (perfil/org): [init schema](../../../supabase/migrations/20260414000001_init_schema.sql) (`handle_new_user`, `on_auth_user_created`)
