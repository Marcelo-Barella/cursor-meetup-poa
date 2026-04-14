const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  credit: "Crédito",
  savings: "Poupança",
  revenue: "Receita",
  expense_other: "Despesa",
};

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatAccountType(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}
