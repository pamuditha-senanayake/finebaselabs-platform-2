import { db } from "@/lib/server/supabase";
import { json, fail, requireHub } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Product catalog for answering product questions. Optional ?q= text filter. */
export async function GET(req: Request) {
  const denied = requireHub(req); if (denied) return denied;
  const q = new URL(req.url).searchParams.get("q")?.trim();
  let query = db().from("products").select("*").order("price");
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,]/g, "")}%,description.ilike.%${q.replace(/[%,]/g, "")}%`);
  const { data, error } = await query;
  return error ? fail(error.message, 500) : json({ products: data });
}
