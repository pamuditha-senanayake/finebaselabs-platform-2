import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";

/** Decide a refund: POST { status: "approved"|"denied", note?, decidedBy? } */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireHub(req); if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => null);
  if (b?.status !== "approved" && b?.status !== "denied") return fail("status must be approved or denied");
  const s = db();
  const { data: r } = await s.from("refund_requests").select("*").eq("id", id).maybeSingle();
  if (!r) return fail("Refund not found", 404);
  const row = r as { status: string; order_id: string };
  if (row.status !== "pending") return fail(`Refund already ${row.status}`, 409);
  const { data, error } = await s.from("refund_requests").update({
    status: b.status, decision_note: b.note ?? null, decided_by: b.decidedBy ?? "hub", decided_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) return fail(error.message, 500);
  await s.from("orders").update({ status: b.status === "approved" ? "refunded" : "refund_denied" }).eq("id", row.order_id);
  return json({ refund: data });
}
