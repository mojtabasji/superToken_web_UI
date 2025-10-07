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

export async function GET(_req: NextRequest, { params }: { params: { userId: string }}) {
  try {
    const ok = await requireAdmin();
    if (!ok) return errorJson("Unauthorized", 401);
    const uid = encodeURIComponent(params.userId);
    // Try modern lookup endpoints in order
    try {
      // Some Cores expose /user or /users result shapes. Try /user first.
      const detail = await coreFetch(`/user/${uid}`);
      return json(detail);
    } catch {
      try {
        const detail = await coreFetch(`/users`, { searchParams: { userId: params.userId, limit: 1 } });
        return json(detail);
      } catch {
        // Fallback: get basic user metadata if available
        const detail = await coreFetch(`/user/metadata`, { searchParams: { userId: params.userId } });
        return json(detail);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core error";
    return errorJson(msg, 500);
  }
}
