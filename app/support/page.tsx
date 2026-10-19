"use client";

import ChatPanel from "@/components/ChatPanel";
import { PageHead } from "@/components/ui";

export default function Support() {
  return (
    <>
      <PageHead title="Support chat" sub="Ask about products, orders or refunds. Agents from the external support platform join this thread via Agent Gateway." />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="card flex h-[34rem] flex-col lg:col-span-2"><ChatPanel /></div>
        <aside className="card h-fit p-5 text-sm">
          <h2 className="label">Try asking</h2>
          <ul className="mt-3 space-y-2 text-muted">
            <li>“I'd like a refund”</li>
            <li>“What is your refund policy?”</li>
            <li>“Tell me about Insight Analytics”</li>
            <li>“Where is my latest order?”</li>
            <li>“Talk to a human”</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
