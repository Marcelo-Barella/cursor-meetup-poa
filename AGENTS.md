# Instruções para agentes

## Visão geral

App Next.js (App Router) com Supabase Auth e Postgres com RLS — demonstração tipo razão financeira. Para stack, tabelas e fluxo humano, veja `README.md`.

## Comunicação

Sempre responda em PT-BR.

## Comandos

- `npm install` — dependências.
- `npm run dev` — desenvolvimento em `http://localhost:3000`.
- `npm run build` — build de produção.
- `npm run lint` — ESLint (`eslint-config-next`).
- `npm run db:seed` — seed em massa (requer `DATABASE_URL`; veja Ambiente).

Supabase (local): `supabase start`, depois `supabase db reset` para aplicar `supabase/migrations/`. Remoto: `supabase link --project-ref <ref>` e `supabase db push`.

## Ambiente

Copie `.env.example` para `.env.local` para o app. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Para o seeder: `DATABASE_URL` (Postgres) e, se necessário para extensões futuras da API, `SUPABASE_SERVICE_ROLE_KEY`. Opcionais: `SEED_TOTAL_TRANSACTIONS`, `SEED_INVOICE_ROWS`, `SEED_AUDIT_ROWS` (limites descritos no `README.md`).

## Next.js desta versão

Esta versão do Next.js pode divergir do conhecimento fixo — APIs, convenções e estrutura de arquivos mudam. Antes de escrever código, consulte o guia em `node_modules/next/dist/docs/`. Respeite avisos de depreciação.

## Arquitetura e dados

Padrões de fetch, auth, camada de dados e org demo: `CLAUDE.md`.

## Segurança

- Não commite `.env.local`, chaves reais nem URIs com credenciais.
- A chave anon e o cliente no browser estão sujeitos à RLS; o seed usa Postgres direto e ignora RLS — use apenas em ambiente controlado.
- `SUPABASE_SERVICE_ROLE_KEY` é privilegiada: nunca em código cliente nem em variáveis `NEXT_PUBLIC_*`.

## Verificação

Antes de considerar a tarefa concluída, execute `npm run lint` e `npm run build` e corrija falhas. Não há script `npm test` nem workflows CI no repositório neste momento.