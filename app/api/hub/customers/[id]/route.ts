import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireHub(req); if (denied) return denied;
  const { id } = await params;
  const s = db();
  const [c, orders, refunds] = await Promise.all([
    s.from("customers").select("*").eq("id", id).maybeSingle(),
    s.from("orders").select("*, products(name, category)").eq("customer_id", id).order("created_at", { ascending: false }),
    s.from("refund_requests").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  return c.data ? json({ customer: c.data, orders: orders.data, refunds: refunds.data }) : fail("Customer not found", 404);
}
