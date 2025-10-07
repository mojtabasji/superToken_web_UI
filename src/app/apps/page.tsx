"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type AppItem = { appId: string } & Record<string, unknown>;

export default function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAppId, setNewAppId] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/core/apps");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to fetch apps");
      const list = Array.isArray(j?.apps) ? j.apps : Array.isArray(j) ? j : [];
      setApps(list as AppItem[]);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Failed to fetch apps");
      } else {
        setError("Failed to fetch apps");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const createApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppId.trim()) return alert("appId is required");
    const res = await fetch("/api/core/apps/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId: newAppId.trim() }),
    });
    const j = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      alert(typeof j?.error === "string" ? j.error : "Create app failed");
      return;
    }
    setNewAppId("");
    load();
  };

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Apps</h1>
        <div className="flex gap-2">
          <Link className="h-8 px-3 rounded border flex items-center" href="/">Home</Link>
          <button className="h-8 px-3 rounded border" onClick={() => history.back()}>Back</button>
        </div>
      </header>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <section className="max-w-xl border rounded p-4 space-y-3">
        <h2 className="text-lg font-medium">New app</h2>
        <form onSubmit={createApp} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="appId">App ID</label>
            <input id="appId" className="w-full px-3 py-2 rounded border bg-transparent" value={newAppId} onChange={(e)=>setNewAppId(e.target.value)} placeholder="e.g. acme-app" />
          </div>
          <button className="h-10 px-4 rounded bg-black text-white dark:bg-white dark:text-black">Create</button>
        </form>
      </section>

      {loading ? <p>Loading…</p> : (
        <ul className="space-y-2">
          {apps.map(a => (
            <li key={a.appId} className="border rounded p-3">
              <div className="font-mono text-xs">{a.appId}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
