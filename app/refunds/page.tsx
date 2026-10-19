"use client";

import { useStore } from "@/lib/store";
import { fmt, fmtDate } from "@/lib/data";
import { PageHead } from "@/components/ui";
import Link from "next/link";

const style = { pending: "border-yellow-500/50 text-yellow-400", approved: "border-accent/50 text-accent", denied: "border-red-500/50 text-red-400" };
export default function Refunds() {
  const { refunds, orders, startRefundChat, productById } = useStore();
  return (
    <>
      <PageHead title="Refunds" sub="Track the status of your refund requests.">
        <button className="btn btn-primary" onClick={() => startRefundChat()}>Request via chat</button>
      </PageHead>
      {refunds.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          No refund requests yet. Start one from <Link href="/orders" className="text-accent hover:underline">Purchase history</Link>.
        </div>
      ) : (
        <div className="card">
          {refunds.map((r) => {
            const o = orders.find((x) => x.id === r.orderId);
            if (!o) return null;
            return (
              <div key={r.id} className="grid gap-3 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">{r.id}</span>
                    <span className={`tag ${style[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="mt-1 text-sm">{productById(o.productId)?.name ?? o.productId} · {fmt(o.amount)}</div>
                  <div className="text-xs text-muted">{r.orderId} · {r.reason}</div>
                  {r.note && <div className="mt-1 text-xs text-white/70">Note: {r.note}</div>}
                </div>
                <div className="text-xs text-muted sm:text-right">
                  <div>{fmtDate(r.date)}</div>
                  <div>via {r.source}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
