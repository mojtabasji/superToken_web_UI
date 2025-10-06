import { errorJson, json } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth";
import { coreFetch } from "@/lib/coreClient";

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  const started = Date.now();
  try {
    try {
      await coreFetch("/hello", { timeoutMs: 8000 });
    } catch {
      // Try root
      try {
        await coreFetch("/", { timeoutMs: 8000 });
      } catch {
        // As a stronger connectivity/auth check, try listing minimal users
        await coreFetch("/users", { timeoutMs: 8000, searchParams: { limit: 1 } });
      }
    }
    const ms = Date.now() - started;
    return json({ status: "up", latencyMs: ms });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core unreachable";
    const ms = Date.now() - started;
    return json({ status: "down", latencyMs: ms, error: msg }, 503);
  }
}
