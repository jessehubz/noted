"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const sb = createBrowserSupabase();

    if (mode === "signup") {
      const { error: err } = await sb.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      setError("Check your email for a confirmation link.");
      setLoading(false);
    } else {
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      router.push("/map");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="auth-sub">
          {mode === "signin"
            ? "Sign in to comment on notes and send messages."
            : "Create an account to interact with notes."}
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="auth-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="auth-input"
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>

        <p className="auth-toggle">
          {mode === "signin" ? (
            <>No account? <button type="button" onClick={() => setMode("signup")}>Sign up</button></>
          ) : (
            <>Have an account? <button type="button" onClick={() => setMode("signin")}>Sign in</button></>
          )}
        </p>
      </form>
    </div>
  );
}
