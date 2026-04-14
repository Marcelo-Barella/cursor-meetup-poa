"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Check your email to confirm, or sign in if confirmations are disabled.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="text-xs uppercase tracking-widest text-muted">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-muted">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-3 py-2 text-xs uppercase tracking-widest ${
            mode === "signin"
              ? "bg-ink text-paper"
              : "border border-line bg-white/50 text-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-3 py-2 text-xs uppercase tracking-widest ${
            mode === "signup"
              ? "bg-accent text-paper"
              : "border border-line bg-white/50 text-muted"
          }`}
        >
          Sign up
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent-hot px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Working..." : mode === "signup" ? "Create account" : "Enter workspace"}
      </button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </form>
  );
}
