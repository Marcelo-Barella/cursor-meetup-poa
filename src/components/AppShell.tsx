import Link from "next/link";
import type { User } from "@supabase/supabase-js";

const nav = [
  { href: "/dashboard", label: "Painel" },
  { href: "/ledger", label: "Razão" },
  { href: "/search", label: "Busca" },
];

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const email = user.email ?? "conectado";
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-baseline gap-3">
            <Link
              href="/dashboard"
              className="font-display text-xl tracking-tight text-ink sm:text-2xl"
            >
              Ledgerline
            </Link>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-muted sm:inline">
              demo financeira
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-transparent px-3 py-1.5 text-ink transition hover:border-line hover:bg-white/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="max-w-[200px] truncate">{email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-line px-3 py-1 text-ink transition hover:border-accent hover:text-accent"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
