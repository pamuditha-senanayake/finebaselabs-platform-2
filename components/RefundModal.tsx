"use client";

import { useState } from "react";
import { refundReasons, daysLeft, fmt, type Order } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function RefundModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { requestRefund, productById } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState(refundReasons[0]);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const p = productById(order.productId);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <div className="label text-accent">Request submitted</div>
            <h2 className="mt-2 text-lg font-semibold">Refund requested for {order.id}</h2>
            <p className="mt-2 text-sm text-muted">Our billing team reviews requests within 2 business days. You can follow progress under Refunds.</p>
            <button className="btn btn-primary mt-6 w-full" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <div className="label">Request refund</div>
            <h2 className="mt-2 text-lg font-semibold">{p?.name ?? order.productId}</h2>
            <p className="text-sm text-muted">{order.id} · {fmt(order.amount)} · {daysLeft(order)} days left in refund window</p>
            <label className="label mt-5 block">Reason</label>
            <select className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)}>
              {refundReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label className="label mt-4 block">Additional details (optional)</label>
            <textarea className="input mt-1 h-24 resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
            {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
            <div className="mt-6 flex gap-3">
              <button className="btn flex-1" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary flex-1" disabled={busy}
                onClick={async () => {
                  setBusy(true); setErr(null);
                  const e = await requestRefund(order.id, note ? `${reason}: ${note}` : reason);
                  setBusy(false);
                  if (e) setErr(e); else setDone(true);
                }}>
                {busy ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
