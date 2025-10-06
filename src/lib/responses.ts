export function json(data: unknown, init: number | ResponseInit = 200) {
  const status = typeof init === "number" ? init : init?.status ?? 200;
  const headers = new Headers(typeof init === "number" ? undefined : init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorJson(message: string, status = 500, extra?: Record<string, unknown>) {
  return json({ error: message, ...(extra ?? {}) } as Record<string, unknown>, status);
}
