import { NextRequest } from "next/server";
import { errorJson, json } from "@/lib/responses";
import { coreFetch } from "@/lib/coreClient";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const { tenantId } = body as { tenantId?: string };
  if (!tenantId || tenantId.trim().length === 0) return errorJson("tenantId is required", 400);
  try {
    // Newer endpoint shape
    try {
      const res = await coreFetch("/tenants", { method: "POST", body: { tenantId } });
      return json(res, 201);
    } catch {
      // Older endpoint shape
      const res = await coreFetch("/multitenancy/tenant", { method: "POST", body: { tenantId } });
      return json(res, 201);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create tenant failed";
    return errorJson(`Create tenant failed: ${msg}`, 500);
  }
}
