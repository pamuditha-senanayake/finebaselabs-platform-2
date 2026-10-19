/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only: uses the service role key. Never import this from client components.
let client: SupabaseClient<any, "public", any> | null = null;
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    client = createClient<any, "public", any>(url, key, { auth: { persistSession: false } });
  }
  return client;
}

// Demo identity: this portal has no login yet, so every browser acts as this customer.
export const DEMO_CUSTOMER_ID = process.env.DEMO_CUSTOMER_ID ?? "11111111-1111-4111-8111-111111111111";
export const REFUND_WINDOW_DAYS = 30;
