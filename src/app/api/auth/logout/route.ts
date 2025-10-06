import { destroySession } from "@/lib/auth";
import { json } from "@/lib/responses";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
