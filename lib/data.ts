export type Product = {
  id: string; name: string; tagline: string; description: string;
  category: "Platform" | "Service" | "Add-on"; price: number; billing: "one-time" | "monthly" | "yearly"; features: string[];
};

export type Order = {
  id: string; productId: string; date: string; amount: number;
  status: "paid" | "refund_pending" | "refunded" | "refund_denied"; method: string;
};

export type Profile = {
  firstName: string; lastName: string; email: string; phone: string;
  company: string; role: string; country: string; timezone: string;
};

export type RefundRequest = {
  id: string; orderId: string; reason: string; source: string; date: string;
  status: "pending" | "approved" | "denied"; note?: string;
};

export const REFUND_WINDOW_DAYS = 30;
export const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
export const refundEligible = (o: Order) => o.status === "paid" && daysSince(o.date) <= REFUND_WINDOW_DAYS;
export const daysLeft = (o: Order) => Math.max(0, REFUND_WINDOW_DAYS - daysSince(o.date));

export const refundReasons = [
  "Not what I expected", "Duplicate purchase", "Technical issue", "Found a better alternative", "Purchased by mistake", "Other",
];

export const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ---- API row → UI model mappers (DB uses snake_case) ---- */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const toProduct = (r: any): Product => ({ ...r, price: Number(r.price), features: r.features ?? [] });
export const toOrder = (r: any): Order => ({ id: r.id, productId: r.product_id, date: r.created_at, amount: Number(r.amount), status: r.status, method: r.method ?? "" });
export const toProfile = (r: any): Profile => ({
  firstName: r.first_name, lastName: r.last_name, email: r.email, phone: r.phone ?? "",
  company: r.company ?? "", role: r.role ?? "", country: r.country ?? "", timezone: r.timezone ?? "",
});
export const toRefund = (r: any): RefundRequest => ({
  id: r.id, orderId: r.order_id, reason: r.reason, source: r.source, date: r.created_at, status: r.status, note: r.decision_note ?? undefined,
});
