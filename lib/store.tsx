"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  toOrder, toProduct, toProfile, toRefund,
  type Order, type Product, type Profile, type RefundRequest,
} from "./data";

export type ChatAction = { label: string; value: string };
export type ChatMessage = {
  id: string; seq: number; from: "customer" | "agent" | "system"; name?: string; text: string; at: number; actions?: ChatAction[]; pending?: boolean;
};

type Store = {
  ready: boolean; error: string | null; reload: () => void;
  products: Product[]; productById: (id: string) => Product | undefined;
  orders: Order[]; profile: Profile; refunds: RefundRequest[]; messages: ChatMessage[];
  typing: boolean; chatOpen: boolean; setChatOpen: (v: boolean) => void;
  saveProfile: (p: Profile) => Promise<string | null>;
  requestRefund: (orderId: string, reason: string) => Promise<string | null>;
  startRefundChat: (orderId?: string) => void;
  sendMessage: (text: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const toMsg = (r: any): ChatMessage => ({
  id: r.id, seq: r.seq, from: r.sender, name: r.sender_name ?? undefined, text: r.body,
  at: new Date(r.created_at).getTime(), actions: r.actions ?? undefined,
});

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile>({} as Profile);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const lastSeq = useRef(0);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    lastSeq.current = Math.max(lastSeq.current, ...incoming.map((m) => m.seq));
    setMessages((cur) => {
      const ids = new Set(cur.map((m) => m.id));
      return [...cur.filter((m) => !(m.pending && incoming.some((i) => i.from === "customer" && i.text === m.text))),
        ...incoming.filter((m) => !ids.has(m.id))];
    });
  }, []);

  const load = useCallback(async (silent = false) => {
    try {
      const d = await api("/api/portal/bootstrap");
      setProducts(d.products.map(toProduct));
      setOrders(d.orders.map(toOrder));
      setProfile(toProfile(d.customer));
      setRefunds(d.refunds.map(toRefund));
      merge(d.messages.map(toMsg));
      setError(null);
      setReady(true);
    } catch (e) {
      if (!silent) setError((e as Error).message);
    }
  }, [merge]);

  useEffect(() => { load(); }, [load]);

  // Poll for agent replies (every 2.5s) and refresh orders/refunds (every 10s) so hub decisions show up.
  useEffect(() => {
    if (!ready) return;
    const chat = setInterval(async () => {
      try {
        const d = await api(`/api/portal/chat?after=${lastSeq.current}`);
        merge(d.messages.map(toMsg));
        setTyping(d.typing);
      } catch { /* transient; next tick retries */ }
    }, 2500);
    const data = setInterval(() => load(true), 10000);
    return () => { clearInterval(chat); clearInterval(data); };
  }, [ready, load, merge]);

  const sendMessage = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const temp: ChatMessage = { id: `tmp-${Date.now()}`, seq: 0, from: "customer", text: t, at: Date.now(), pending: true };
    setMessages((m) => [...m, temp]);
    try {
      const d = await api("/api/portal/chat", { method: "POST", body: JSON.stringify({ text: t }) });
      const real = toMsg(d.message);
      lastSeq.current = Math.max(lastSeq.current, real.seq);
      setMessages((m) => m.map((x) => (x.id === temp.id ? real : x)).filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i));
    } catch {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      setMessages((m) => [...m, { id: `err-${Date.now()}`, seq: 0, from: "system", text: "Message failed to send. Please try again.", at: Date.now() }]);
    }
  }, []);

  const requestRefund = useCallback(async (orderId: string, reason: string) => {
    try {
      await api("/api/portal/refunds", { method: "POST", body: JSON.stringify({ orderId, reason }) });
      await load(true);
      return null;
    } catch (e) { return (e as Error).message; }
  }, [load]);

  const saveProfile = useCallback(async (p: Profile) => {
    try {
      const d = await api("/api/portal/profile", {
        method: "PATCH",
        body: JSON.stringify({ first_name: p.firstName, last_name: p.lastName, email: p.email, phone: p.phone,
          company: p.company, role: p.role, country: p.country, timezone: p.timezone }),
      });
      setProfile(toProfile(d.customer));
      return null;
    } catch (e) { return (e as Error).message; }
  }, []);

  const startRefundChat = useCallback((orderId?: string) => {
    setChatOpen(true);
    sendMessage(orderId ? `I'd like a refund for order ${orderId}` : "I'd like a refund");
  }, [sendMessage]);

  const value = useMemo<Store>(() => ({
    ready, error, reload: () => { setError(null); load(); },
    products, productById: (id) => products.find((p) => p.id === id),
    orders, profile, refunds, messages, typing, chatOpen, setChatOpen,
    saveProfile, requestRefund, startRefundChat, sendMessage,
  }), [ready, error, load, products, orders, profile, refunds, messages, typing, chatOpen, saveProfile, requestRefund, startRefundChat, sendMessage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
