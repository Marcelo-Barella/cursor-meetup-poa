# Ledgerline — demonstração SaaS financeira

Next.js (App Router) + Supabase Auth + Postgres com segurança em nível de linha, interface editorial em “fita de razão” e um seeder em TypeScript em massa para consultas em escala MCP (50k–200k+ linhas).

## Pré-requisitos

- Node 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (stack local ou projeto remoto vinculado)
- Opcional: gateway MCP Docker conforme `.cursor/mcp.json` para demos de ferramentas

## Ambiente

Copie `.env.example` para `.env.local` no app web:

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no painel do Supabase (Settings → API).

Para o seed, adicione:

- `DATABASE_URL` — string de conexão Postgres (local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`; hospedado: URI do pooler com `sslmode=require` se necessário).
- `SUPABASE_SERVICE_ROLE_KEY` — só usada se você estender o seeder para chamar a REST API; o script hoje usa SQL direto via `pg`.

Ajustes opcionais em `.env.local`:

- `SEED_TOTAL_TRANSACTIONS` (padrão `150000`, limitado entre 50k–200k)
- `SEED_INVOICE_ROWS` (padrão `8000`)
- `SEED_AUDIT_ROWS` (padrão `20000`)

## Reset do banco e migrações

**Supabase local**

```bash
supabase start
supabase db reset
```

`db reset` aplica tudo em `supabase/migrations/`, incluindo a org demo fixa (`demo-corp`, UUID `11111111-1111-1111-1111-111111111111`), enums, tabelas, RLS, grants e a RPC `search_transactions`.

**Projeto remoto**

```bash
supabase link --project-ref <sua-ref>
supabase db push
```

## Dados de seed (50k–200k linhas)

Após as migrações:

```bash
npm install
npm run db:seed
```

O script trunca linhas financeiras da org demo, recria contas/categorias, insere transações em lotes de 2.000, depois faturas, saldos e auditoria. O progresso aparece no stdout.

## Rodar o app

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, cadastre-se ou entre. Novos usuários entram em `profiles` e são vinculados à org demo pelo trigger `handle_new_user`, de modo que a RLS permita leituras sem fluxo de convite separado.

## Páginas

- `/dashboard` — totais, exposição de faturas em aberto, linhas recentes, cauda de auditoria
- `/ledger` — transações paginadas
- `/search` — busca de texto completo via `search_transactions` (GIN em `tsvector` gerado)

## Esquema (Postgres)

| Tabela          | Finalidade                                   |
|-----------------|----------------------------------------------|
| `orgs`          | Inquilino                                    |
| `org_members`   | Associação usuário ↔ org (motor da RLS)    |
| `profiles`      | Nome de exibição ligado a `auth.users.id`  |
| `accounts`      | Contas estilo razão / banco                  |
| `categories`    | Classificação hierárquica                    |
| `transactions`  | Linhas do razão + vetor de busca gerado    |
| `invoices`      | Documentos estilo contas a receber         |
| `balances`      | Saldos por conta em um instante              |
| `audit_log`     | Eventos em estilo somente acrescentar      |

## Notas para agentes

Veja `AGENTS.md` (particularidades da versão do Next.js) e `CLAUDE.md` (onde ficam as queries e o seed).
