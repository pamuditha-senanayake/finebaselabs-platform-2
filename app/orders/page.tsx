"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { productById, fmt, fmtDate, refundEligible, daysLeft, REFUND_WINDOW_DAYS, type Order } from "@/lib/data";
import { PageHead, StatusTag } from "@/components/ui";
import RefundModal from "@/components/RefundModal";

export default function Orders() {
  const { orders, startRefundChat } = useStore();
  const [target, setTarget] = useState<Order | null>(null);

  return (
    <>
      <PageHead title="Purchase history" sub={`Refunds are available within ${REFUND_WINDOW_DAYS} days of purchase.`} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Order", "Product", "Date", "Payment", "Amount", "Status", ""].map((h) => (
                <th key={h} className="label px-5 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-raised/50">
                <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                <td className="px-5 py-4">{productById(o.productId).name}</td>
                <td className="px-5 py-4 text-muted">{fmtDate(o.date)}</td>
                <td className="px-5 py-4 text-muted">{o.method}</td>
                <td className="px-5 py-4 font-mono">{fmt(o.amount)}</td>
                <td className="px-5 py-4"><StatusTag status={o.status} /></td>
                <td className="px-5 py-4 text-right">
                  {refundEligible(o) ? (
                    <div className="flex justify-end gap-2">
                      <button className="btn px-3 py-1 text-xs" onClick={() => setTarget(o)}>Request refund <span className="text-muted">· {daysLeft(o)}d</span></button>
                      <button className="btn px-3 py-1 text-xs" onClick={() => startRefundChat(o.id)}>Via chat</button>
                    </div>
                  ) : o.status === "paid" ? (
                    <span className="text-xs text-muted">Window closed</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {target && <RefundModal order={target} onClose={() => setTarget(null)} />}
    </>
  );
}
