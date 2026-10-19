"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import ChatPanel from "./ChatPanel";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Products & services" },
  { href: "/my-products", label: "My products" },
  { href: "/orders", label: "Purchase history" },
  { href: "/refunds", label: "Refunds" },
  { href: "/support", label: "Support chat" },
  { href: "/account", label: "Account" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { chatOpen, setChatOpen, profile, refunds, ready, error, reload } = useStore();
  const pending = refunds.filter((r) => r.status === "pending").length;
  const onSupport = path === "/support";

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-4 md:py-6">
          <span className="grid h-6 w-6 place-items-center bg-accent font-mono text-xs font-bold text-black">F</span>
          <span className="font-semibold tracking-tight">Finebase Labs</span>
        </div>
        <nav className="flex overflow-x-auto md:block md:px-3">
          {nav.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`flex shrink-0 items-center justify-between border-l-2 px-4 py-2.5 text-sm transition-colors md:mb-0.5 ${
                  active ? "border-accent bg-raised text-white" : "border-transparent text-muted hover:bg-raised hover:text-white"}`}>
                {n.label}
                {n.href === "/refunds" && pending > 0 && <span className="tag border-accent/50 text-accent">{pending}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-line p-4 md:absolute md:bottom-0 md:block md:w-60">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center border border-line bg-raised font-mono text-xs">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </span>
            <div className="min-w-0 text-xs">
              <div className="truncate text-white">{profile.firstName} {profile.lastName}</div>
              <div className="truncate text-muted">{profile.company}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          {error ? (
            <div className="card p-8 text-sm"><div className="label text-red-400">Couldn&apos;t load data</div>
              <p className="mt-2 text-muted">{error}</p><button className="btn mt-4" onClick={reload}>Retry</button></div>
          ) : !ready ? <div className="label">Loading…</div> : children}
        </div>
      </main>

      {!onSupport && (
        <>
          {chatOpen && (
            <div className="fixed inset-x-0 bottom-0 z-40 flex h-[34rem] max-h-[85vh] flex-col border border-line bg-surface shadow-2xl shadow-black sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[24rem]">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
          <button onClick={() => setChatOpen(!chatOpen)} aria-label="Toggle chat"
            className="fixed bottom-6 right-6 z-50 flex h-12 items-center gap-2 border border-accent bg-accent px-4 text-sm font-medium text-black hover:bg-white">
            {chatOpen ? "Close" : "Chat with support"}
          </button>
        </>
      )}
    </div>
  );
}
