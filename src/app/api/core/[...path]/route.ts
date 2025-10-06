import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { errorJson } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { path: string[] }}) { return proxy(req, params); }
export async function POST(req: NextRequest, { params }: { params: { path: string[] }}) { return proxy(req, params); }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] }}) { return proxy(req, params); }
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] }}) { return proxy(req, params); }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] }}) { return proxy(req, params); }

async function proxy(req: NextRequest, { path }: { path: string[] }) {
  const ok = await requireAdmin();
  if (!ok) return errorJson("Unauthorized", 401);
  try {
    const { CORE_URL, CORE_API_KEY, CORE_CDI_VERSION } = getEnv();
    const target = new URL(CORE_URL);
    // join path segments safely
    const joined = path.join("/");
    target.pathname = `${target.pathname.replace(/\/$/, "")}/${joined}`;
    const { searchParams } = new URL(req.url);
    searchParams.forEach((v, k) => target.searchParams.set(k, v));
    const headers = new Headers(req.headers);
    headers.set("host", target.host);
    headers.set("content-type", headers.get("content-type") || "application/json");
    if (CORE_API_KEY) headers.set("api-key", CORE_API_KEY);
    if (CORE_CDI_VERSION) headers.set("cdi-version", CORE_CDI_VERSION);
    // Remove browser cookies from upstream call
    headers.delete("cookie");
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });
    const resHeaders = new Headers(upstream.headers);
    // prevent CORS / set JSON content when needed
    return new Response(await upstream.body?.getReader().read().then(() => upstream.clone().body) ?? upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Proxy error";
    return errorJson(msg, 500);
  }
}
