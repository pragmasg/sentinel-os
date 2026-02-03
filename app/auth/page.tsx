"use client";

import { useMemo, useState } from "react";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const url = new URL(window.location.href);
    return url.searchParams.get("next") ?? "/dashboard";
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Authentication failed");
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/10 rounded-xl p-6 bg-neutral-950">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">pragmas</h1>
          <button
            className="text-sm text-white/70 hover:text-white"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            disabled={busy}
          >
            {mode === "login" ? "Create account" : "Have an account?"}
          </button>
        </div>

        <p className="mt-2 text-sm text-white/70">
          {mode === "login" ? "Sign in" : "Sign up"} to access Sentinel OS.
        </p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs text-white/60">Email</span>
            <input
              className="mt-1 w-full rounded-md bg-black border border-white/10 px-3 py-2 outline-none focus:border-orange-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/60">Password</span>
            <input
              className="mt-1 w-full rounded-md bg-black border border-white/10 px-3 py-2 outline-none focus:border-green-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <span className="block mt-1 text-[11px] text-white/40">
              Minimum 12 characters.
            </span>
          </label>

          {error ? (
            <div className="text-sm text-orange-300">{error}</div>
          ) : null}

          <button
            className="w-full rounded-md bg-white text-black py-2 font-medium hover:bg-white/90 disabled:opacity-60"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <div className="text-xs text-white/50">
            This MVP uses human-in-the-loop governance. No trade execution.
          </div>
        </div>
      </div>
    </div>
  );
}
