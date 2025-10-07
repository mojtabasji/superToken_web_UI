"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  userId: string;
  timeJoined?: number;
  emails?: string[];
};
type Tenant = { tenantId: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([{ tenantId: "public" }]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTenant, setNewTenant] = useState<string>("public");

  const load = async (paginationToken?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/core/users", window.location.origin);
      url.searchParams.set("limit", "50");
      if (paginationToken) url.searchParams.set("paginationToken", paginationToken);
      const res = await fetch(url);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to fetch users");
      setUsers(j.users || j.users ?? j.users ?? []);
      setNextToken(j.nextPaginationToken ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(null); }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/core/tenants");
        const j = await res.json();
        if (Array.isArray(j.tenants)) setTenants(j.tenants);
      } catch {
        // ignore; default to public
      }
    })();
  }, []);

  const del = async (userId: string) => {
    if (!confirm(`Delete user ${userId}?`)) return;
    const res = await fetch(`/api/core/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  const j = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      alert(j.error || "Delete failed");
      return;
    }
    // reload first page after deletion
    load(null);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return alert("Email and password required");
    const res = await fetch("/api/core/users/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword, tenantId: newTenant }),
    });
    const j = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      let msg = "Create user failed";
      if (typeof j === "object" && j && "error" in j) {
        const errVal = (j as Record<string, unknown>).error;
        if (typeof errVal === "string") msg = errVal;
      }
      alert(msg);
      return;
    }
    setNewEmail("");
    setNewPassword("");
    // reload first page after creation
    load(null);
  };

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <div className="flex gap-2">
          <Link className="h-8 px-3 rounded border flex items-center" href="/">Home</Link>
          <button className="h-8 px-3 rounded border" onClick={() => history.back()}>Back</button>
        </div>
      </header>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <section className="max-w-xl border rounded p-4 space-y-3">
        <h2 className="text-lg font-medium">Add new user</h2>
        <form onSubmit={create} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="tenant">Tenant</label>
            <select id="tenant" className="w-full h-10 rounded border" value={newTenant} onChange={e=>setNewTenant(e.target.value)}>
              {tenants.map(t => <option key={t.tenantId} value={t.tenantId}>{t.tenantId}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="email">Email</label>
            <input id="email" type="email" className="w-full px-3 py-2 rounded border bg-transparent" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="password">Password</label>
            <input id="password" type="password" className="w-full px-3 py-2 rounded border bg-transparent" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
          </div>
          <button className="h-10 px-4 rounded bg-black text-white dark:bg-white dark:text-black">Create user</button>
        </form>
      </section>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-2">User ID</th>
              <th className="text-left p-2">Email</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.userId} className="border-t">
                <td className="p-2 font-mono text-xs">{u.userId}</td>
                <td className="p-2">{u.emails?.[0] ?? "-"}</td>
                <td className="p-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link className="h-8 px-2 rounded border flex items-center" href={`/users/${encodeURIComponent(u.userId)}`}>View</Link>
                    <button className="h-8 px-2 rounded bg-red-600 text-white" onClick={() => del(u.userId)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button disabled={loading} onClick={() => load(nextToken)} className="h-9 px-3 rounded border disabled:opacity-50">{loading ? "Loading…" : (nextToken ? "Load more" : "Reload")}</button>
      </div>
    </main>
  );
}
