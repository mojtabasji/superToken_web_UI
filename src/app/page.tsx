"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState<"checking" | "up" | "down">("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const check = async () => {
    setStatus("checking");
    setStatusError(null);
    try {
      const res = await fetch("/api/core/health");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Core down");
      setStatus(j.status === "up" ? "up" : "down");
      setLatency(typeof j.latencyMs === "number" ? j.latencyMs : null);
    } catch (e: unknown) {
      setStatus("down");
      setStatusError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => { void check(); }, []);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">SuperTokens Admin UI</h1>
        <form action="/api/auth/logout" method="post">
          <button className="h-9 px-3 rounded border">Logout</button>
        </form>
      </header>

      <section className="flex gap-4">
        <Link className="h-10 px-4 rounded border flex items-center" href="/users">Users</Link>
        <Link className="h-10 px-4 rounded border flex items-center" href="/apps">Apps</Link>
        <Link className="h-10 px-4 rounded border flex items-center" href="/tenants">Tenants</Link>
        <Link className="h-10 px-4 rounded border flex items-center" href="/settings">Settings</Link>
      </section>

      <section className="max-w-xl border rounded p-4 space-y-2">
        <h2 className="text-lg font-medium">SuperTokens Core status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === "up" ? "bg-green-500" : status === "checking" ? "bg-yellow-500" : "bg-red-600"}`} />
          <span className="text-sm">{status === "checking" ? "Checking..." : status === "up" ? "Up" : "Down"}</span>
          {typeof latency === "number" && <span className="text-xs opacity-70">({latency} ms)</span>}
        </div>
        {statusError && <p className="text-xs text-red-600">{statusError}</p>}
        <button onClick={check} className="h-8 px-3 rounded border">Re-check</button>
      </section>
    </main>
  );
}
