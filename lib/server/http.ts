import { NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (message: string, status = 400) => json({ error: message }, status);

/** Hub endpoints require `Authorization: Bearer <HUB_API_KEY>`. Returns a Response on failure, null on success. */
export function requireHub(req: Request) {
  const expected = process.env.HUB_API_KEY;
  if (!expected) return fail("HUB_API_KEY is not configured on the server", 500);
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("Unauthorized", 401);
  return null;
}

/** Push a customer message to the hub's webhook (if configured). Hub can also poll /api/hub/messages. */
export async function notifyHub(payload: unknown) {
  const url = process.env.HUB_WEBHOOK_URL;
  if (!url) return false;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HUB_WEBHOOK_SECRET)
    headers["X-Finebase-Signature"] = "sha256=" + createHmac("sha256", process.env.HUB_WEBHOOK_SECRET).update(body).digest("hex");
  try {
    const r = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch { return false; }
}

export const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
