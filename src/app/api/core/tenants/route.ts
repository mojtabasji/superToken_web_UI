// no request type needed
import { coreFetch } from "@/lib/coreClient";
import { errorJson, json } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const ok = await requireAdmin();
    if (!ok) return errorJson("Unauthorized", 401);
    const url = new URL(req.url);
    const appId = url.searchParams.get("appId") || undefined;
    try {
      const data = await coreFetch(appId ? `/apps/${encodeURIComponent(appId)}/tenants` : "/tenants");
      return json(data);
    } catch (e) {
      try {
        const data = await coreFetch(appId ? `/multitenancy/apps/${encodeURIComponent(appId)}/tenants` : "/multitenancy/tenants");
        return json(data);
      } catch (e2) {
        const msg = (e2 instanceof Error ? e2.message : (e instanceof Error ? e.message : "Core error")) || "Core error";
        // If endpoint is not found (404), assume single-tenant 'public' and return a graceful response
        if (/\b404\b/i.test(msg) || /not found/i.test(msg)) {
          return json({
            tenants: [{ tenantId: "public" }],
            multitenancyEnabled: false,
            note: "Tenants endpoint not found on Core; assuming single-tenant 'public'.",
          });
        }
        return errorJson(`Failed to fetch tenants: ${msg}`, 500);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core error";
    return errorJson(msg);
  }
}
