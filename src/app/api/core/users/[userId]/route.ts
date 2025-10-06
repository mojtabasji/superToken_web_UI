import type { NextRequest } from "next/server";
import { coreFetch } from "@/lib/coreClient";
import { errorJson, json } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { userId: string }}) {
  try {
    const ok = await requireAdmin();
    if (!ok) return errorJson("Unauthorized", 401);
    try {
      const data = await coreFetch(`/user/${encodeURIComponent(params.userId)}`, { method: "DELETE" });
      return json(data);
    } catch {
      // Fallback for older CDI: POST /user/remove { userId }
      const data = await coreFetch(`/user/remove`, { method: "POST", body: { userId: params.userId } });
      return json(data);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core error";
    return errorJson(msg);
  }
}
