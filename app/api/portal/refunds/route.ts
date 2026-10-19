import { DEMO_CUSTOMER_ID } from "@/lib/server/supabase";
import { json, fail } from "@/lib/server/http";
import { createRefund } from "@/lib/server/queries";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.orderId || !b?.reason) return fail("orderId and reason are required");
  const r = await createRefund(String(b.orderId), String(b.reason).slice(0, 500), "Purchase history", DEMO_CUSTOMER_ID);
  return r.error ? fail(r.error, 422) : json(r, 201);
}
