import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  AuditLogRow,
  Balance,
  Category,
  DashboardSummary,
  Invoice,
  Transaction,
} from "@/lib/supabase/types";

const DEMO_ORG_SLUG = "demo-corp";

export async function getDemoOrgId(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client
    .from("orgs")
    .select("id")
    .eq("slug", DEMO_ORG_SLUG)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function getDashboardSummary(
  client: SupabaseClient,
  orgId: string
): Promise<DashboardSummary> {
  const txCount = client
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  const openInvoices = client
    .from("invoices")
    .select("amount_cents")
    .eq("org_id", orgId)
    .in("status", ["draft", "sent"]);
  const lastTx = client
    .from("transactions")
    .select("posted_at")
    .eq("org_id", orgId)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const [c, inv, last] = await Promise.all([txCount, openInvoices, lastTx]);
  const openCents =
    inv.data?.reduce((s, row) => s + Number((row as { amount_cents: number }).amount_cents), 0) ??
    0;
  return {
    transaction_count: c.count ?? 0,
    invoice_open_cents: openCents,
    last_posted_at: (last.data as { posted_at?: string } | null)?.posted_at ?? null,
  };
}

export async function listAccounts(client: SupabaseClient, orgId: string): Promise<Account[]> {
  const { data, error } = await client
    .from("accounts")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function listCategories(client: SupabaseClient, orgId: string): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function listRecentTransactions(
  client: SupabaseClient,
  orgId: string,
  limit: number
): Promise<Transaction[]> {
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("org_id", orgId)
    .order("posted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function searchTransactionsRpc(
  client: SupabaseClient,
  orgId: string,
  query: string,
  limit: number
): Promise<Transaction[]> {
  const { data, error } = await client.rpc("search_transactions", {
    p_org_id: orgId,
    p_query: query.trim(),
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function listInvoices(
  client: SupabaseClient,
  orgId: string,
  limit: number
): Promise<Invoice[]> {
  const { data, error } = await client
    .from("invoices")
    .select("*")
    .eq("org_id", orgId)
    .order("issue_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function listBalances(
  client: SupabaseClient,
  orgId: string,
  limit: number
): Promise<Balance[]> {
  const { data, error } = await client
    .from("balances")
    .select("*")
    .eq("org_id", orgId)
    .order("as_of_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Balance[];
}

export async function listAuditTail(
  client: SupabaseClient,
  orgId: string,
  limit: number
): Promise<AuditLogRow[]> {
  const { data, error } = await client
    .from("audit_log")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}
