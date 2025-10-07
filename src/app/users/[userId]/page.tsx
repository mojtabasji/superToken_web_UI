"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/core/users/${encodeURIComponent(userId)}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed to load user");
        setData(j);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-8 px-3 rounded border flex items-center" href="/">Home</Link>
          <button className="h-8 px-3 rounded border" onClick={() => history.back()}>Back</button>
        </div>
        <h1 className="text-xl font-semibold">User: <span className="font-mono text-xs">{userId}</span></h1>
        <div />
      </header>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="border rounded p-4">
            <h2 className="font-medium mb-2">Summary</h2>
            <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </section>
        </div>
      )}
    </main>
  );
}
