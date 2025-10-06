"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }
      router.push("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm" htmlFor="username">Username</label>
          <input id="username" className="w-full px-3 py-2 rounded border bg-transparent" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">Password</label>
          <input id="password" type="password" className="w-full px-3 py-2 rounded border bg-transparent" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button disabled={loading} className="w-full h-10 rounded bg-black text-white dark:bg-white dark:text-black disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
