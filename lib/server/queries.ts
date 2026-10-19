import { db, REFUND_WINDOW_DAYS } from "./supabase";
import { daysSince } from "./http";

export type OrderRow = { id: string; customer_id: string; product_id: string; amount: number; method: string | null; status: string; created_at: string };

export async function getOrCreateConversation(customerId: string) {
  const s = db();
  const { data: open } = await s.from("conversations").select("*").eq("customer_id", customerId).eq("status", "open")
    .order("created_at", { ascending: false }).limit(1);
  if (open?.length) return open[0] as { id: string; customer_id: string };
  const { data, error } = await s.from("conversations").insert({ customer_id: customerId }).select().single();
  if (error) throw error;
  return data as { id: string; customer_id: string };
}

export async function addMessage(conversationId: string, m: { sender: "customer" | "agent" | "system"; sender_name?: string; body: string; actions?: unknown }) {
  const { data, error } = await db().from("messages").insert({
    conversation_id: conversationId, sender: m.sender, sender_name: m.sender_name ?? null, body: m.body, actions: m.actions ?? null,
  }).select().single();
  if (error) throw error;
  return data as MessageRow;
}

export type MessageRow = {
  id: string; conversation_id: string; seq: number; sender: string; sender_name: string | null;
  body: string; actions: { label: string; value: string }[] | null; delivered_to_hub: boolean; created_at: string;
};

export function refundCheck(o: OrderRow | null, customerId?: string): string | null {
  if (!o || (customerId && o.customer_id !== customerId)) return "Order not found";
  if (o.status !== "paid") return `Order is ${o.status}, not refundable`;
  if (daysSince(o.created_at) > REFUND_WINDOW_DAYS) return `Outside the ${REFUND_WINDOW_DAYS}-day refund window`;
  return null;
}

export async function createRefund(orderId: string, reason: string, source: "Purchase history" | "Chat" | "Agent", customerId?: string) {
  const s = db();
  const { data: order } = await s.from("orders").select("*").eq("id", orderId).maybeSingle();
  const o = order as OrderRow | null;
  const err = refundCheck(o, customerId);
  if (err) return { error: err };
  const { data, error } = await s.from("refund_requests").insert({
    order_id: orderId, customer_id: o!.customer_id, reason, source,
  }).select().single();
  if (error) return { error: error.message };
  await s.from("orders").update({ status: "refund_pending" }).eq("id", orderId);
  return { refund: data };
}
