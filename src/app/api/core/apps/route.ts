import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { coreFetch } from "@/lib/coreClient";
import { errorJson, json } from "@/lib/responses";

export async function GET(_req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  try {
    try {
      const data = await coreFetch("/apps");
      return json(data);
    } catch (e) {
      try {
        const data = await coreFetch("/multitenancy/apps");
        return json(data);
      } catch (e2) {
        const msg = (e2 instanceof Error ? e2.message : (e instanceof Error ? e.message : "Core error")) || "Core error";
        if (/\b404\b/i.test(msg) || /not found/i.test(msg)) {
          return json({
            apps: [{ appId: "public" }],
            multiAppEnabled: false,
            note: "Apps endpoint not found on Core; assuming single-app 'public'.",
          });
        }
        return errorJson(`Failed to fetch apps: ${msg}`, 500);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Core error";
    return errorJson(msg);
  }
}
