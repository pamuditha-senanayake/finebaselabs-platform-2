import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Full context for a conversation: customer, orders, refunds and message history. */
export async function GET(req: Request, { params }: Ctx) {
  const denied = requireHub(req); if (denied) return denied;
  const { id } = await params;
  const s = db();
  const { data: conv } = await s.from("conversations").select("*").eq("id", id).maybeSingle();
  if (!conv) return fail("Conversation not found", 404);
  const cid = (conv as { customer_id: string }).customer_id;
  const [customer, orders, refunds, messages] = await Promise.all([
    s.from("customers").select("*").eq("id", cid).single(),
    s.from("orders").select("*, products(name, category)").eq("customer_id", cid).order("created_at", { ascending: false }),
    s.from("refund_requests").select("*").eq("customer_id", cid).order("created_at", { ascending: false }),
    s.from("messages").select("*").eq("conversation_id", id).order("seq"),
  ]);
  return json({ conversation: conv, customer: customer.data, orders: orders.data, refunds: refunds.data, messages: messages.data });
}

/** Set typing indicator or close: PATCH { typing?: boolean, status?: "open"|"closed" } */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = requireHub(req); if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof b.typing === "boolean") patch.agent_typing = b.typing;
  if (b.status === "open" || b.status === "closed") patch.status = b.status;
  if (!Object.keys(patch).length) return fail("Nothing to update");
  const { error } = await db().from("conversations").update(patch).eq("id", id);
  return error ? fail(error.message, 500) : json({ ok: true });
}
