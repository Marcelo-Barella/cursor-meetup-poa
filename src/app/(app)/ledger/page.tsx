import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDemoOrgId, listAccounts, listCategories } from "@/lib/data/finance";
import { formatCents, formatDate } from "@/lib/format";

type SearchParams = Promise<{ page?: string }>;

export default async function LedgerPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 40;
  const supabase = await createSupabaseServerClient();
  const orgId = await getDemoOrgId(supabase);
  if (!orgId) {
    return <p className="text-sm text-muted">Organização demo ausente. Execute as migrações.</p>;
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [{ data: rows, error, count }, accounts, categories] = await Promise.all([
    supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .order("posted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
    listAccounts(supabase, orgId),
    listCategories(supabase, orgId),
  ]);
  if (error) {
    return <p className="text-sm text-accent-hot">{error.message}</p>;
  }
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Razão</p>
        <h1 className="mt-2 font-display text-4xl">Registro cronológico</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Página {page} de {totalPages.toLocaleString("pt-BR")} — {total.toLocaleString("pt-BR")} linhas
          visíveis na sua sessão.
        </p>
      </header>
      <div className="overflow-hidden rounded-3xl border border-line bg-white/80 shadow-sm animate-rise-delay">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-paper/90 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Conta</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id} className="border-t border-line/80">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.posted_at)}</td>
                <td className="px-4 py-3">{accountMap.get(row.account_id) ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {row.category_id ? catMap.get(row.category_id) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3">{row.description}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    row.amount_cents < 0 ? "text-accent-hot" : "text-accent"
                  }`}
                >
                  {formatCents(row.amount_cents, row.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {page > 1 ? (
          <a
            className="rounded-full border border-line px-4 py-2 hover:bg-white/70"
            href={`/ledger?page=${page - 1}`}
          >
            Anterior
          </a>
        ) : null}
        {page < totalPages ? (
          <a
            className="rounded-full border border-line px-4 py-2 hover:bg-white/70"
            href={`/ledger?page=${page + 1}`}
          >
            Próxima
          </a>
        ) : null}
      </div>
    </div>
  );
}
