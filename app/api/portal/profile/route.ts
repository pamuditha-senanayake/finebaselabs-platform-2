import { db, DEMO_CUSTOMER_ID } from "@/lib/server/supabase";
import { json, fail } from "@/lib/server/http";

const allowed = ["first_name", "last_name", "email", "phone", "company", "role", "country", "timezone"];

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");
  const patch = Object.fromEntries(Object.entries(body).filter(([k, v]) => allowed.includes(k) && typeof v === "string" && v.trim()));
  if (!Object.keys(patch).length) return fail("Nothing to update");
  const { data, error } = await db().from("customers").update(patch).eq("id", DEMO_CUSTOMER_ID).select().single();
  return error ? fail(error.message, 400) : json({ customer: data });
}
