"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmt, fmtDate, daysLeft, refundEligible } from "@/lib/data";
import { PageHead } from "@/components/ui";

export default function MyProducts() {
  const { orders, productById } = useStore();
  const owned = orders.filter((o) => o.status === "paid" || o.status === "refund_pending");

  return (
    <>
      <PageHead title="My products" sub={`${owned.length} active products and services.`} />
      <div className="grid gap-px border border-line bg-line md:grid-cols-2">
        {owned.map((o) => {
          const p = productById(o.productId);
          if (!p) return null;
          return (
            <div key={o.id} className="bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="label">{p.category}</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase text-accent">
                  <span className="h-1.5 w-1.5 bg-accent" />{o.status === "refund_pending" ? "Refund pending" : "Active"}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-muted">{p.tagline}</p>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
                <div><dt className="label">Purchased</dt><dd className="mt-1">{fmtDate(o.date)}</dd></div>
                <div><dt className="label">Paid</dt><dd className="mt-1 font-mono">{fmt(o.amount)}</dd></div>
                <div><dt className="label">Refund</dt><dd className="mt-1">{refundEligible(o) ? `${daysLeft(o)}d left` : "Closed"}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">Looking for more? <Link href="/products" className="text-accent hover:underline">Browse the catalog →</Link></p>
    </>
  );
}
