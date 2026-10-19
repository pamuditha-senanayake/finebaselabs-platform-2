"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmt, fmtDate, refundEligible } from "@/lib/data";
import { PageHead, StatusTag } from "@/components/ui";

export default function Overview() {
  const { orders, profile, refunds, setChatOpen, productById } = useStore();
  const active = new Set(orders.filter((o) => o.status === "paid" || o.status === "refund_pending").map((o) => o.productId));
  const spent = orders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.amount, 0);
  const eligible = orders.filter(refundEligible).length;

  const stats = [
    ["Active products", String(active.size)],
    ["Total spent", fmt(spent)],
    ["Open refund requests", String(refunds.filter((r) => r.status === "pending").length)],
    ["Refund-eligible orders", String(eligible)],
  ];

  return (
    <>
      <PageHead title={`Welcome back, ${profile.firstName}`} sub="Your Findbase Labs customer portal.">
        <button className="btn btn-primary" onClick={() => setChatOpen(true)}>Chat with support</button>
      </PageHead>

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-surface p-5">
            <div className="label">{k}</div>
            <div className="mt-3 font-mono text-3xl">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="label">Recent purchases</h2>
            <Link href="/orders" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-0">
              <div className="min-w-0">
                <div className="truncate text-sm">{productById(o.productId)?.name ?? o.productId}</div>
                <div className="font-mono text-xs text-muted">{o.id} · {fmtDate(o.date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusTag status={o.status} />
                <span className="w-20 text-right font-mono text-sm">{fmt(o.amount)}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="label">Need a refund?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Anything you bought in the last 30 days can be refunded. Request it from your purchase history or just ask in chat.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/orders" className="btn">Go to purchase history</Link>
            <button className="btn btn-primary" onClick={() => setChatOpen(true)}>Ask in chat</button>
          </div>
        </section>
      </div>
    </>
  );
}
