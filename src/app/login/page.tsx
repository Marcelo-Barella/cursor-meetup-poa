import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md animate-rise rounded-3xl border border-line bg-glass p-10 shadow-[0_24px_80px_rgba(12,15,18,0.08)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Demonstração Cursor</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Ledgerline</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Entre com o Supabase Auth. Novos usuários são vinculados à organização demo compartilhada para
          RLS adequada a demos.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-8 text-xs text-muted">Use Cadastrar no formulário para criar um usuário de demonstração.</p>
      </div>
    </div>
  );
}
