"use client";
import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername: newUsername || undefined, newPassword: newPassword || undefined }),
      });
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const errMsg = typeof j === "object" && j && "error" in j && typeof (j as Record<string, unknown>).error === "string"
          ? (j as Record<string, unknown>).error as string
          : "Update failed";
        throw new Error(errMsg);
      }
      setMsg("Credentials updated.");
      setNewPassword("");
      setCurrentPassword("");
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Update failed";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex gap-2">
          <Link className="h-8 px-3 rounded border flex items-center" href="/">Home</Link>
          <button className="h-8 px-3 rounded border" onClick={() => history.back()}>Back</button>
        </div>
      </header>

      <section className="max-w-xl border rounded p-4 space-y-3">
        <h2 className="text-lg font-medium">Admin credentials</h2>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="newUsername">New username</label>
            <input id="newUsername" className="w-full px-3 py-2 rounded border bg-transparent" value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Leave empty to keep current" />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" className="w-full px-3 py-2 rounded border bg-transparent" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Leave empty to keep current" />
          </div>
          <div className="space-y-1">
            <label className="text-sm" htmlFor="currentPassword">Current password (required)</label>
            <input id="currentPassword" type="password" className="w-full px-3 py-2 rounded border bg-transparent" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required />
          </div>
          <button disabled={loading} className="h-10 px-4 rounded bg-black text-white dark:bg-white dark:text-black disabled:opacity-50">{loading ? "Saving…" : "Save changes"}</button>
        </form>
      </section>
    </main>
  );
}
