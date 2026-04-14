import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoOrgId, searchTransactionsRpc } from "@/lib/data/finance";
import { formatCents, formatDate } from "@/lib/format";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const orgId = await getDemoOrgId(supabase);
  if (!orgId) {
    return <p className="text-sm text-muted">Organização demo ausente.</p>;
  }
  const results = q ? await searchTransactionsRpc(supabase, orgId, q, 80) : [];
  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Busca</p>
        <h1 className="mt-2 font-display text-4xl">Busca de texto completo no razão</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Usa <code className="text-ink">search_transactions</code> com coluna gerada{" "}
          <code className="text-ink">tsvector</code> — ajustada para volumes de linhas em escala MCP.
        </p>
      </header>
      <form className="animate-rise-delay flex flex-wrap gap-3" action="/search" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Ex.: folha, transferência, SaaS, viagem…"
          className="min-w-[240px] flex-1 rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none ring-accent/20 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper hover:opacity-90"
        >
          Buscar
        </button>
      </form>
      {!q ? (
        <p className="text-sm text-muted">Digite um termo para varrer descrições, memorandos e referências.</p>
      ) : (
        <ul className="space-y-3 animate-rise">
          {results.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
              Nenhum resultado para &quot;{q}&quot;.
            </li>
          ) : (
            results.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white/75 px-4 py-4"
              >
                <div>
                  <p className="text-sm text-ink">{row.description}</p>
                  <p className="text-xs text-muted">
                    {formatDate(row.posted_at)}
                    {row.memo ? ` · ${row.memo}` : ""}
                  </p>
                </div>
                <p className={row.amount_cents < 0 ? "text-accent-hot" : "text-accent"}>
                  {formatCents(row.amount_cents, row.currency)}
                </p>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
