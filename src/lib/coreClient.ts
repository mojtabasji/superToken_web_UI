import { getEnv } from "./env";
// Optional TLS relax (dev only)
let tlsInitialized = false;
async function ensureTlsSettings() {
  if (tlsInitialized) return;
  try {
    const { CORE_INSECURE_TLS } = getEnv();
    if (CORE_INSECURE_TLS) {
      // Use undici global dispatcher to disable TLS validation for Core calls
      // Note: This affects all fetch calls in this process. Use only in dev.
      const undici = await import("undici");
      const agent = new undici.Agent({ connect: { rejectUnauthorized: false } } as unknown as import("undici").Agent.Options);
      undici.setGlobalDispatcher(agent);
    }
  } catch {
    // ignore if undici not available or in edge runtime
  } finally {
    tlsInitialized = true;
  }
}

export type CoreFetchOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
};

export async function coreFetch(path: string, opts: CoreFetchOptions = {}) {
  await ensureTlsSettings();
  const { CORE_URL, CORE_API_KEY, CORE_CDI_VERSION } = getEnv();
  const url = new URL(path, CORE_URL);
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const headers = new Headers(opts.headers);
  headers.set("content-type", "application/json");
  if (CORE_API_KEY) headers.set("api-key", CORE_API_KEY);
  if (CORE_CDI_VERSION) headers.set("cdi-version", CORE_CDI_VERSION);
  const controller = new AbortController();
  const timeout = opts.timeoutMs ?? 20000;
  const timer = setTimeout(() => controller.abort(), timeout);
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: controller.signal,
    // Allow Core self-signed in dev if needed: rely on runtime settings.
  });
  clearTimeout(timer);
  const text = await res.text();
  let json: unknown = undefined;
  try { json = text ? JSON.parse(text) : undefined; } catch {}
  if (!res.ok) {
    let msg: string | undefined;
    if (typeof json === "object" && json !== null && "message" in json) {
      const obj = json as Record<string, unknown>;
      const val = obj["message"];
      if (typeof val === "string") msg = val;
    }
    throw new Error(msg || `Core error ${res.status}: ${text}`);
  }
  return json;
}
