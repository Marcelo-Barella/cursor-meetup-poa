# Notas Claude / agente

Comandos, variáveis de ambiente, Supabase CLI e critérios de verificação: `AGENTS.md`.

## Arquitetura da aplicação

- **Next.js App Router**: rotas em `src/app/`. O grupo `(app)` agrupa páginas autenticadas; o layout chama `createSupabaseServerClient()` e redireciona para `/login` se não houver usuário.
- **Auth**: `src/middleware.ts` renova a sessão (cookies Supabase); o layout `(app)` exige usuário.
- **Supabase**: cliente servidor em `src/lib/supabase/server.ts` (`createSupabaseServerClient`) para Server Components e rotas; cliente navegador em `src/lib/supabase/browser.ts` quando precisar de interação no cliente. Ambos usam a chave anon; a RLS aplica-se nos dois.
- **Camada de dados**: consultas ao Postgres via Supabase ficam em `src/lib/data/` (hoje `finance.ts`). Funções recebem `SupabaseClient` e, para dados da org, `orgId`. Não espalhe `.from(...)` complexos nas páginas; extraia para essa camada.
- **Escopo de org**: resolva a org demo com `getDemoOrgId(client)` a partir do slug `demo-corp` (UUID nas migrações). Filtre leituras por `org_id` no código da app, além da RLS.
- **Tipos**: use tipos de `src/lib/supabase/types.ts` para linhas e agregados retornados pelo Supabase.
- **RPC**: parâmetros SQL seguem convenção `p_`* (ex.: `search_transactions` com `p_org_id`, `p_query`, `p_limit`).
- **Dados em massa**: `npm run db:seed` usa SQL direto via `pg` (ignora RLS). Variáveis e limites: `AGENTS.md` e `README.md`.
- **Slug da org demo**: `demo-corp` (UUID fixo nas migrações). Novos usuários recebem vínculo pelo trigger `handle_new_user`.

## Convenções de código

- **TypeScript / React**: `camelCase` para funções, variáveis e propriedades de objetos em código de aplicação; `PascalCase` para componentes React e nomes exportados de componentes (ficheiros em `src/components/` como `AppShell.tsx`, `LoginForm.tsx`).
- **Constantes de módulo**: `UPPER_SNAKE_CASE` para valores fixos partilhados (ex.: slug ou limites no módulo de dados).
- **Base de dados**: tabelas e colunas em `snake_case` nas migrações e nos selects; alinhe chaves em objetos tipados com o que o Supabase devolve.
- **Imports**: alias `@/` para `src/`; aspas duplas, como no resto do projeto.
- **Rotas e ficheiros**: segmentos de rota em pastas (`(app)`, `auth/signout`); componentes reutilizáveis com nome igual ao export principal.

