import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { createSession } from "@/lib/auth";
import { errorJson, json } from "@/lib/responses";
import { loadAdmin, verifyAdminPassword } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };
    // Bootstrap admin file on first call, then verify credentials
  await getEnv();
  const admin = await loadAdmin();
    const correctUser = username === admin.username;
    const correctPass = await verifyAdminPassword(password || "");
    if (!correctUser || !correctPass) {
      return errorJson("Invalid credentials", 401);
    }
    await createSession();
    return json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Login error";
    return errorJson(msg, 500);
  }
}
