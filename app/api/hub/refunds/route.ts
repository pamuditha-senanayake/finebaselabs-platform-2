import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";
import { createRefund } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

/** List refunds: ?status=pending&customerId= */
export async function GET(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const q = new URL(req.url).searchParams;
  let query = db().from("refund_requests").select("*, orders(amount, product_id, created_at, status)").order("created_at", { ascending: false });
  if (q.get("status")) query = query.eq("status", q.get("status")!);
  if (q.get("customerId")) query = query.eq("customer_id", q.get("customerId")!);
  const { data, error } = await query;
  return error ? fail(error.message, 500) : json({ refunds: data });
}

/** Agent files a refund on the customer's behalf: POST { orderId, reason } (30-day rule enforced) */
export async function POST(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b?.orderId || !b?.reason) return fail("orderId and reason are required");
  const r = await createRefund(String(b.orderId), String(b.reason).slice(0, 500), b.source === "Chat" ? "Chat" : "Agent");
  return r.error ? fail(r.error, 422) : json(r, 201);
}
