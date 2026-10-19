import { db, DEMO_CUSTOMER_ID } from "@/lib/server/supabase";
import { json, fail, notifyHub } from "@/lib/server/http";
import { addMessage, getOrCreateConversation } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

/** Customer polls for new messages: GET /api/portal/chat?after=<seq> */
export async function GET(req: Request) {
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0) || 0;
  const conv = await getOrCreateConversation(DEMO_CUSTOMER_ID);
  const [{ data }, c] = await Promise.all([
    db().from("messages").select("*").eq("conversation_id", conv.id).gt("seq", after).order("seq"),
    db().from("conversations").select("agent_typing").eq("id", conv.id).single(),
  ]);
  return json({ messages: data ?? [], typing: Boolean((c.data as { agent_typing?: boolean } | null)?.agent_typing) });
}

/** Customer sends a message: POST { text } */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const text = typeof b?.text === "string" ? b.text.trim().slice(0, 2000) : "";
  if (!text) return fail("text is required");
  const conv = await getOrCreateConversation(DEMO_CUSTOMER_ID);
  const msg = await addMessage(conv.id, { sender: "customer", body: text });
  const delivered = await notifyHub({ event: "message.created", conversationId: conv.id, customerId: DEMO_CUSTOMER_ID, message: msg });
  if (delivered) await db().from("messages").update({ delivered_to_hub: true }).eq("id", msg.id);
  return json({ message: msg, deliveredToHub: delivered }, 201);
}
