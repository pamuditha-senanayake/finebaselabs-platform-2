"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { messages, typing, sendMessage } = useStore();
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages, typing]);
  const lastId = messages[messages.length - 1]?.id;

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center bg-accent font-mono text-xs font-bold text-black">FN</span>
          <div>
            <div className="text-sm font-medium">Finebase support</div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 bg-accent" /> Connected via Agent Gateway
            </div>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="text-muted hover:text-white" aria-label="Close chat">✕</button>}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-muted">Send a message to start. A support agent will reply here.</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.from === "customer" ? "flex flex-col items-end" : "flex flex-col items-start"}>
            <div className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed ${
              m.from === "customer" ? `bg-accent text-black ${m.pending ? "opacity-60" : ""}` : m.from === "system" ? "border border-red-500/40 text-red-400" : "border border-line bg-raised"}`}>
              {m.text}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted">
              {m.from === "customer" ? "You" : m.name ?? "Support"} · {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            {m.actions && m.id === lastId && (
              <div className="mt-2 flex max-w-full flex-wrap gap-2">
                {m.actions.map((a) => (
                  <button key={a.value} onClick={() => sendMessage(a.value)}
                    className="border border-accent/50 px-3 py-1.5 text-left text-xs text-accent hover:bg-accent hover:text-black">
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && <div className="font-mono text-xs text-muted">Agent is typing…</div>}
        <div ref={end} />
      </div>

      <form className="flex border-t border-line" onSubmit={(e) => { e.preventDefault(); sendMessage(draft); setDraft(""); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about products, orders, refunds…"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted" />
        <button className="border-l border-line px-5 text-sm text-accent hover:bg-accent hover:text-black">Send</button>
      </form>
    </>
  );
}
