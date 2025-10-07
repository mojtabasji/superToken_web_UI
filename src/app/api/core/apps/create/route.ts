import { NextRequest } from "next/server";
import { errorJson, json } from "@/lib/responses";
import { coreFetch } from "@/lib/coreClient";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const { appId } = body as { appId?: string };
  if (!appId || appId.trim().length === 0) return errorJson("appId is required", 400);
  try {
    try {
      const res = await coreFetch("/apps", { method: "POST", body: { appId } });
      return json(res, 201);
    } catch {
      const res = await coreFetch("/multitenancy/app", { method: "POST", body: { appId } });
      return json(res, 201);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create app failed";
    return errorJson(`Create app failed: ${msg}`, 500);
  }
}
