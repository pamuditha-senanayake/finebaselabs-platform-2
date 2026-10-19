import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";
import { addMessage } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

/** Poll for customer messages: GET ?since=<seq>&conversationId=&sender=customer&limit=100 */
export async function GET(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const q = new URL(req.url).searchParams;
  let query = db().from("messages").select("*, conversations(customer_id)").gt("seq", Number(q.get("since") ?? 0) || 0)
    .order("seq").limit(Math.min(Number(q.get("limit") ?? 100) || 100, 500));
  const sender = q.get("sender") ?? "customer";
  if (sender !== "any") query = query.eq("sender", sender);
  if (q.get("conversationId")) query = query.eq("conversation_id", q.get("conversationId")!);
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  const messages = (data ?? []) as { seq: number; id: string }[];
  return json({ messages, nextSince: messages.length ? messages[messages.length - 1].seq : Number(q.get("since") ?? 0) || 0 });
}

/** Agent reply: POST { conversationId, body, actions?: [{label,value}], senderName? } */
export async function POST(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b?.conversationId || typeof b?.body !== "string" || !b.body.trim()) return fail("conversationId and body are required");
  const { data: conv } = await db().from("conversations").select("id").eq("id", b.conversationId).maybeSingle();
  if (!conv) return fail("Conversation not found", 404);
  const actions = Array.isArray(b.actions)
    ? b.actions.filter((a: { label?: unknown; value?: unknown }) => typeof a?.label === "string" && typeof a?.value === "string").slice(0, 8) : null;
  const message = await addMessage(b.conversationId, { sender: "agent", sender_name: b.senderName ?? "Finn", body: b.body.slice(0, 4000), actions });
  await db().from("conversations").update({ agent_typing: false }).eq("id", b.conversationId);
  return json({ message }, 201);
}

/** Mark messages as received by the hub: PATCH { ids: [...] } */
export async function PATCH(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!Array.isArray(b?.ids)) return fail("ids array required");
  const { error } = await db().from("messages").update({ delivered_to_hub: true }).in("id", b.ids);
  return error ? fail(error.message, 500) : json({ ok: true });
}
