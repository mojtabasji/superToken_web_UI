import { NextRequest } from "next/server";
import { errorJson, json } from "@/lib/responses";
import { coreFetch } from "@/lib/coreClient";
import { requireAdmin } from "@/lib/auth";

// Tries modern Core endpoint for user creation; if not available, returns 400 with hint
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  const body = await req.json().catch(() => ({}));
  const { email, password, tenantId } = body as { email?: string; password?: string; tenantId?: string };
  if (!email || !password) return errorJson("email and password are required", 400);
  try {
    // Create in specific tenant if provided
    const path = tenantId ? `/tenants/${encodeURIComponent(tenantId)}/recipe/emailpassword/user/signup` : `/recipe/emailpassword/user/signup`;
    const result = await coreFetch(path, { method: "POST", body: { email, password } });
    return json(result, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create user failed";
    // Helpful hint when emailpassword recipe is not enabled on Core
    return errorJson(`Create user failed: ${msg}. Ensure emailpassword recipe is enabled for the tenant.`, 500);
  }
}
