export type AccountType =
  | "checking"
  | "credit"
  | "savings"
  | "revenue"
  | "expense_other";

export type CategoryKind = "income" | "expense" | "transfer";

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export type TransactionStatus = "pending" | "posted" | "void";

export type Org = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export type Account = {
  id: string;
  org_id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  external_id: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  org_id: string;
  parent_id: string | null;
  name: string;
  code: string | null;
  kind: CategoryKind;
  created_at: string;
};

export type Transaction = {
  id: string;
  org_id: string;
  account_id: string;
  category_id: string | null;
  amount_cents: number;
  currency: string;
  posted_at: string;
  description: string;
  memo: string | null;
  external_ref: string | null;
  status: TransactionStatus;
  created_at: string;
};

export type Invoice = {
  id: string;
  org_id: string;
  counterparty: string;
  issue_date: string;
  due_date: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  number: string;
  created_at: string;
};

export type Balance = {
  id: string;
  org_id: string;
  account_id: string;
  as_of_date: string;
  amount_cents: number;
  created_at: string;
};

export type AuditLogRow = {
  id: number;
  org_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type DashboardSummary = {
  transaction_count: number;
  invoice_open_cents: number;
  last_posted_at: string | null;
};
