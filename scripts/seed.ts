import "dotenv/config";
import { faker } from "@faker-js/faker";
import pg from "pg";

const DEMO_ORG_ID = "11111111-1111-1111-1111-111111111111";

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for seeding");
  }
  const totalTx = Math.min(200_000, Math.max(50_000, num("SEED_TOTAL_TRANSACTIONS", 150_000)));
  const invoiceRows = Math.min(50_000, Math.max(2_000, num("SEED_INVOICE_ROWS", 8_000)));
  const auditRows = Math.min(100_000, Math.max(5_000, num("SEED_AUDIT_ROWS", 20_000)));
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const orgCheck = await client.query(`select 1 from public.orgs where id = $1`, [DEMO_ORG_ID]);
    if (orgCheck.rowCount === 0) {
      throw new Error("Demo org row missing. Apply supabase migrations first.");
    }
    await client.query("begin");
    await client.query(`delete from public.audit_log where org_id = $1`, [DEMO_ORG_ID]);
    await client.query(`delete from public.balances where org_id = $1`, [DEMO_ORG_ID]);
    await client.query(`delete from public.invoices where org_id = $1`, [DEMO_ORG_ID]);
    await client.query(`delete from public.transactions where org_id = $1`, [DEMO_ORG_ID]);
    await client.query(`update public.categories set parent_id = null where org_id = $1`, [
      DEMO_ORG_ID,
    ]);
    await client.query(`delete from public.categories where org_id = $1`, [DEMO_ORG_ID]);
    await client.query(`delete from public.accounts where org_id = $1`, [DEMO_ORG_ID]);
    const accountSpecs: { name: string; type: string }[] = [
      { name: "Operating — Primary", type: "checking" },
      { name: "Operating — Reserve", type: "checking" },
      { name: "Payroll Clearing", type: "checking" },
      { name: "Corporate Card", type: "credit" },
      { name: "Treasury MMF", type: "savings" },
      { name: "AR — SaaS", type: "revenue" },
      { name: "AR — Services", type: "revenue" },
      { name: "AP — Vendors", type: "expense_other" },
      { name: "Intercompany", type: "checking" },
      { name: "FX — USD", type: "checking" },
      { name: "FX — EUR", type: "checking" },
      { name: "Petty Cash", type: "checking" },
    ];
    const accountIds: string[] = [];
    for (const a of accountSpecs) {
      const r = await client.query(
        `insert into public.accounts (org_id, name, account_type, currency)
         values ($1,$2,$3::public.account_type,'USD') returning id`,
        [DEMO_ORG_ID, a.name, a.type]
      );
      accountIds.push(r.rows[0].id as string);
    }
    const topCategories = [
      { name: "Revenue", kind: "income" },
      { name: "Payroll", kind: "expense" },
      { name: "Cloud & Infra", kind: "expense" },
      { name: "Sales & Marketing", kind: "expense" },
      { name: "G&A", kind: "expense" },
      { name: "Transfers", kind: "transfer" },
    ];
    const categoryIds: string[] = [];
    for (const c of topCategories) {
      const r = await client.query(
        `insert into public.categories (org_id, name, kind)
         values ($1,$2,$3::public.category_kind) returning id`,
        [DEMO_ORG_ID, c.name, c.kind]
      );
      categoryIds.push(r.rows[0].id as string);
    }
    for (let i = 0; i < 24; i++) {
      const parent = pick(categoryIds.slice(0, 5));
      await client.query(
        `insert into public.categories (org_id, parent_id, name, code, kind)
         values ($1,$2,$3,$4,$5::public.category_kind)`,
        [
          DEMO_ORG_ID,
          parent,
          faker.commerce.department() + " " + faker.string.alphanumeric(4),
          faker.string.alpha({ length: 3 }).toUpperCase(),
          "expense",
        ]
      );
    }
    const allCats = await client.query(`select id from public.categories where org_id = $1`, [
      DEMO_ORG_ID,
    ]);
    const leafCatIds = (allCats.rows as { id: string }[]).map((x) => x.id);
    const statusChoices = ["posted", "posted", "posted", "pending"] as const;
    const templates = [
      "ACH {verb} {company}",
      "Wire to {company}",
      "Card charge — {company}",
      "Invoice {num} — {company}",
      "Payroll run {date}",
      "SaaS subscription — {company}",
      "Travel — {city}",
      "Benefits — {company}",
      "FX reval — {currency}",
      "Interest {dir}",
    ];
    const batch = 2000;
    let inserted = 0;
    while (inserted < totalTx) {
      const slice = Math.min(batch, totalTx - inserted);
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let p = 1;
      for (let i = 0; i < slice; i++) {
        const accountId = pick(accountIds);
        const posted = faker.date.recent({ days: 720 });
        const postedStr = posted.toISOString().slice(0, 10);
        const isInflow = Math.random() < 0.22;
        const magnitude = faker.number.int({ min: 500, max: 250_000 }) * 100;
        const amount = (isInflow ? 1 : -1) * magnitude;
        const tpl = pick(templates);
        const desc = faker.helpers.mustache(tpl, {
          verb: pick(["credit", "debit", "return"]),
          company: faker.company.name(),
          num: String(faker.number.int({ min: 10000, max: 99999 })),
          date: postedStr,
          city: faker.location.city(),
          currency: pick(["USD", "EUR", "GBP"]),
          dir: pick(["credit", "debit"]),
        });
        const memo = Math.random() < 0.35 ? faker.finance.transactionDescription() : null;
        const ext = Math.random() < 0.25 ? `REF-${faker.string.alphanumeric(10).toUpperCase()}` : null;
        const cat = Math.random() < 0.92 ? pick(leafCatIds) : null;
        const status = pick([...statusChoices]);
        placeholders.push(
          `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++}::public.transaction_status)`
        );
        values.push(
          DEMO_ORG_ID,
          accountId,
          cat,
          amount,
          "USD",
          postedStr,
          desc,
          memo,
          ext,
          status
        );
      }
      await client.query(
        `insert into public.transactions
          (org_id, account_id, category_id, amount_cents, currency, posted_at, description, memo, external_ref, status)
         values ${placeholders.join(",")}`,
        values
      );
      inserted += slice;
      process.stdout.write(`\rtransactions ${inserted}/${totalTx}`);
    }
    process.stdout.write("\n");
    for (let i = 0; i < invoiceRows; i++) {
      const issue = faker.date.recent({ days: 540 });
      const due = new Date(issue);
      due.setDate(due.getDate() + faker.number.int({ min: 15, max: 60 }));
      const st = pick(["draft", "sent", "paid", "void"] as const);
      const amt = faker.number.int({ min: 5_000, max: 900_000 }) * 100;
      await client.query(
        `insert into public.invoices
          (org_id, counterparty, issue_date, due_date, amount_cents, currency, status, number)
         values ($1,$2,$3::date,$4::date,$5,'USD',$6::public.invoice_status,$7)`,
        [
          DEMO_ORG_ID,
          faker.company.name(),
          issue.toISOString().slice(0, 10),
          due.toISOString().slice(0, 10),
          amt,
          st,
          `SEEDINV-${i}-${faker.string.alphanumeric(8).toUpperCase()}`,
        ]
      );
    }
    const balanceDays = 120;
    for (const acc of accountIds) {
      let running = faker.number.int({ min: 50_000, max: 5_000_000 }) * 100;
      for (let d = 0; d < balanceDays; d++) {
        const day = new Date();
        day.setDate(day.getDate() - d);
        running += faker.number.int({ min: -80_000, max: 120_000 }) * 100;
        await client.query(
          `insert into public.balances (org_id, account_id, as_of_date, amount_cents)
           values ($1,$2,$3::date,$4)`,
          [DEMO_ORG_ID, acc, day.toISOString().slice(0, 10), running]
        );
      }
    }
    for (let i = 0; i < auditRows; i++) {
      await client.query(
        `insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, payload)
         values ($1,null,$2,$3,gen_random_uuid(),$4::jsonb)`,
        [
          DEMO_ORG_ID,
          pick(["row.view", "export.csv", "policy.check", "rpc.call", "seed.batch"]),
          pick(["transaction", "invoice", "account", "category", "balance"]),
          JSON.stringify({ batch: Math.floor(i / 500), host: faker.internet.domainName() }),
        ]
      );
    }
    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          org_id: DEMO_ORG_ID,
          transactions: totalTx,
          invoices: invoiceRows,
          balances: accountIds.length * balanceDays,
          audit_log: auditRows,
        },
        null,
        2
      )
    );
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
