"use client";

import { useState } from "react";
import { fmt } from "@/lib/data";
import { useStore } from "@/lib/store";
import { PageHead } from "@/components/ui";

const cats = ["All", "Platform", "Service", "Add-on"] as const;
const per = { monthly: "/mo", yearly: "/yr", "one-time": " one-time" };

export default function Products() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const { orders, sendMessage, setChatOpen, products } = useStore();
  const owned = new Set(orders.filter((o) => o.status === "paid" || o.status === "refund_pending").map((o) => o.productId));
  const list = products.filter((p) => cat === "All" || p.category === cat);

  return (
    <>
      <PageHead title="Products & services" sub="Everything Findbase Labs offers." />
      <div className="mb-6 flex gap-px border border-line bg-line sm:w-fit">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`flex-1 px-4 py-2 text-sm sm:flex-none ${cat === c ? "bg-accent text-black" : "bg-surface text-muted hover:text-white"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="flex flex-col bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="label">{p.category}</span>
              {owned.has(p.id) && <span className="tag border-accent/50 text-accent">Owned</span>}
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h2>
            <p className="text-sm text-muted">{p.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">{p.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-accent">+</span>{f}</li>)}
            </ul>
            <div className="mt-auto flex items-end justify-between pt-6">
              <div className="font-mono"><span className="text-2xl">{fmt(p.price)}</span><span className="text-xs text-muted">{per[p.billing]}</span></div>
              {owned.has(p.id)
                ? <button className="btn" onClick={() => { setChatOpen(true); sendMessage(`Tell me about ${p.name}`); }}>Ask about it</button>
                : <button className="btn btn-primary" onClick={() => alert("Demo only: checkout isn't connected.")}>Purchase</button>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
