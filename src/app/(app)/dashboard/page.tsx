import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDashboardSummary,
  getDemoOrgId,
  listAccounts,
  listAuditTail,
  listCategories,
  listRecentTransactions,
} from "@/lib/data/finance";
import { formatAccountType, formatCents, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const orgId = await getDemoOrgId(supabase);
  if (!orgId) {
    return (
      <div className="animate-rise rounded-3xl border border-line bg-white/70 p-8">
        <h1 className="font-display text-2xl">Sem organização de demonstração</h1>
        <p className="mt-2 text-sm text-muted">
          Aplique as migrações para que a organização com slug <code className="text-ink">demo-corp</code>{" "}
          exista.
        </p>
      </div>
    );
  }
  const [summary, accounts, categories, recent, audit] = await Promise.all([
    getDashboardSummary(supabase, orgId),
    listAccounts(supabase, orgId),
    listCategories(supabase, orgId),
    listRecentTransactions(supabase, orgId, 8),
    listAuditTail(supabase, orgId, 6),
  ]);
  return (
    <div className="space-y-10">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Visão geral</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Panorama operacional</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Agregados ao vivo no Postgres com segurança em nível de linha. Amplie o conjunto com o script
          de seed para demos de busca em escala MCP.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3 animate-rise-delay">
        <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted">Transações</p>
          <p className="mt-3 font-display text-3xl text-ink">
            {summary.transaction_count.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted">Faturas em aberto</p>
          <p className="mt-3 font-display text-3xl text-accent-hot">
            {formatCents(summary.invoice_open_cents)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted">Último lançamento</p>
          <p className="mt-3 font-display text-2xl text-ink">
            {summary.last_posted_at ? formatDate(summary.last_posted_at) : "—"}
          </p>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-line bg-white/70 p-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl">Lançamentos recentes</h2>
            <a href="/ledger" className="text-xs uppercase tracking-widest text-accent hover:underline">
              Razão completa
            </a>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="text-ink">{row.description}</p>
                  <p className="text-xs text-muted">{formatDate(row.posted_at)}</p>
                </div>
                <p className={row.amount_cents < 0 ? "text-accent-hot" : "text-accent"}>
                  {formatCents(row.amount_cents, row.currency)}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-white/70 p-6">
            <h2 className="font-display text-xl">Contas</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {accounts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 border-b border-line/60 pb-2">
                  <span>{a.name}</span>
                  <span className="text-xs uppercase text-muted">{formatAccountType(a.account_type)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 p-6">
            <h2 className="font-display text-xl">Sinais</h2>
            <p className="mt-2 text-xs text-muted">
              {categories.length} categorias configuradas para esta organização.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              {audit.map((row) => (
                <li key={row.id} className="flex justify-between gap-2">
                  <span className="truncate">{row.action}</span>
                  <span>{formatDate(row.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
