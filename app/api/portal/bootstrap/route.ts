import { db, DEMO_CUSTOMER_ID } from "@/lib/server/supabase";
import { json, fail } from "@/lib/server/http";
import { getOrCreateConversation } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = db();
    const [products, customer, orders, refunds, conv] = await Promise.all([
      s.from("products").select("*").order("price"),
      s.from("customers").select("*").eq("id", DEMO_CUSTOMER_ID).single(),
      s.from("orders").select("*").eq("customer_id", DEMO_CUSTOMER_ID).order("created_at", { ascending: false }),
      s.from("refund_requests").select("*").eq("customer_id", DEMO_CUSTOMER_ID).order("created_at", { ascending: false }),
      getOrCreateConversation(DEMO_CUSTOMER_ID),
    ]);
    if (customer.error) return fail("Customer not found", 404);
    const msgs = await s.from("messages").select("*").eq("conversation_id", conv.id).order("seq");
    return json({ products: products.data, customer: customer.data, orders: orders.data, refunds: refunds.data, conversationId: conv.id, messages: msgs.data });
  } catch (e) { return fail((e as Error).message, 500); }
}
