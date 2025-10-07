"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Json = Record<string, unknown>;
type Tenant = { tenantId: string } & Json;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apps, setApps] = useState<{ appId: string }[]>([]);
  const [appId, setAppId] = useState<string>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTenantId, setNewTenantId] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const appsRes = await fetch("/api/core/apps");
      const appsJson = await appsRes.json();
      const appList = Array.isArray(appsJson?.apps) ? appsJson.apps : Array.isArray(appsJson) ? appsJson : [{ appId: "public" }];
      setApps(appList as { appId: string }[]);
      // Ensure selected app is valid
      if (!appList.find((a: { appId: string }) => a.appId === appId)) {
        setAppId(appList[0]?.appId ?? "public");
      }

      const res = await fetch(`/api/core/tenants?${new URLSearchParams(appId ? { appId } : {})}`);
      const j: unknown = await res.json();
      if (!res.ok) {
        const msg = (typeof j === "object" && j && "error" in j && typeof (j as Record<string, unknown>).error === "string")
          ? (j as Record<string, unknown>).error as string
          : "Failed to fetch tenants";
        throw new Error(msg);
      }
      let list: unknown = j;
      if (typeof j === "object" && j && "tenants" in j) {
        list = (j as Record<string, unknown>).tenants;
      }
      const arr: Tenant[] = Array.isArray(list)
        ? (list as Tenant[])
        : [];
      setTenants(arr);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch tenants";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [appId]);

  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId.trim()) return alert("tenantId is required");
    const res = await fetch("/api/core/tenants/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId: newTenantId.trim(), appId }),
    });
    const j = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      const msg = typeof j === "object" && j && "error" in j && typeof (j as Record<string, unknown>).error === "string"
        ? (j as Record<string, unknown>).error as string
        : "Create tenant failed";
      alert(msg);
      return;
    }
    setNewTenantId("");
    load();
  };

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <div className="flex gap-2">
          <Link className="h-8 px-3 rounded border flex items-center" href="/">Home</Link>
          <button className="h-8 px-3 rounded border" onClick={() => history.back()}>Back</button>
        </div>
      </header>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <section className="max-w-xl border rounded p-4 space-y-3">
        <h2 className="text-lg font-medium">New tenant</h2>
        <form onSubmit={createTenant} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="app">App</label>
            <select id="app" className="w-full px-3 py-2 rounded border bg-transparent" value={appId} onChange={e=>setAppId(e.target.value)}>
              {apps.map(a => (<option key={a.appId} value={a.appId}>{a.appId}</option>))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="tenantId">Tenant ID</label>
            <input id="tenantId" className="w-full px-3 py-2 rounded border bg-transparent" value={newTenantId} onChange={e=>setNewTenantId(e.target.value)} placeholder="e.g. acme" />
          </div>
          <button className="h-10 px-4 rounded bg-black text-white dark:bg-white dark:text-black">Create</button>
        </form>
      </section>

      {loading ? <p>Loading…</p> : (
        <ul className="space-y-2">
          {tenants.map(t => (
            <li key={t.tenantId} className="border rounded p-3">
              <div className="font-mono text-xs">{t.tenantId}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
