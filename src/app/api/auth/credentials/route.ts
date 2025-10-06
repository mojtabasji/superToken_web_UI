import { requireAdmin } from "@/lib/auth";
import { errorJson, json } from "@/lib/responses";
import { updateAdminCredentials, verifyAdminPassword } from "@/lib/settings";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const ok = await requireAdmin();
    if (!ok) return errorJson("Unauthorized", 401);
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newUsername, newPassword } = body as {
      currentPassword?: string;
      newUsername?: string;
      newPassword?: string;
    };
    if (!currentPassword) return errorJson("currentPassword is required", 400);
    const passOK = await verifyAdminPassword(currentPassword);
    if (!passOK) return errorJson("Invalid current password", 403);
    if (!newUsername && !newPassword) return errorJson("No changes provided", 400);
    const updated = await updateAdminCredentials({ username: newUsername, newPassword });
    return json({ ok: true, username: updated.username });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update error";
    return errorJson(msg, 500);
  }
}
