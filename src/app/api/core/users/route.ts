import { NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";
import { errorJson, json } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const ok = await requireAdmin();
    if (!ok) return errorJson("Unauthorized", 401);
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 50);
    const paginationToken = searchParams.get("paginationToken") ?? undefined;
    const tenantId = searchParams.get("tenantId") ?? undefined;
    const result = await coreFetch("/users", {
      searchParams: { limit, paginationToken, tenantId },
    });
    return json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core error";
    return errorJson(msg);
  }
}
