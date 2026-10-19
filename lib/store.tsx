"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  initialOrders, initialProfile, initialRefunds, products, productById, refundEligible, daysLeft, daysSince,
  refundReasons, REFUND_WINDOW_DAYS, fmt, type Order, type Profile, type RefundRequest,
} from "./data";

export type ChatAction = { label: string; value: string };
export type ChatMessage = {
  id: string; from: "customer" | "agent"; text: string; at: number; actions?: ChatAction[];
};

type Flow = { step: "order" | "reason" | "confirm"; orderId?: string; reason?: string } | null;

type Store = {
  orders: Order[]; profile: Profile; refunds: RefundRequest[]; messages: ChatMessage[];
  typing: boolean; chatOpen: boolean; setChatOpen: (v: boolean) => void;
  saveProfile: (p: Profile) => void;
  requestRefund: (orderId: string, reason: string, source: RefundRequest["source"]) => void;
  startRefundChat: (orderId?: string) => void;
  sendMessage: (text: string) => void;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

let seq = 0;
const mid = () => `m${Date.now()}-${seq++}`;

const welcome: ChatMessage = {
  id: "welcome", from: "agent", at: Date.now(),
  text: "Hi Amara, I'm Finn from Findbase support. I can answer questions about our products, your orders, or help with a refund.",
  actions: [
    { label: "Request a refund", value: "I'd like a refund" },
    { label: "Browse products", value: "What products do you offer?" },
    { label: "Refund policy", value: "What is your refund policy?" },
  ],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState(initialOrders);
  const [profile, setProfile] = useState(initialProfile);
  const [refunds, setRefunds] = useState(initialRefunds);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [typing, setTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const flow = useRef<Flow>(null);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const requestRefund = useCallback((orderId: string, reason: string, source: RefundRequest["source"]) => {
    setOrders((o) => o.map((x) => (x.id === orderId ? { ...x, status: "refund_pending" } : x)));
    setRefunds((r) => [
      { id: `RF-${2300 + r.length + 1}`, orderId, reason, source, date: new Date().toISOString(), status: "pending" },
      ...r,
    ]);
  }, []);

  const pushAgent = useCallback((text: string, actions?: ChatAction[], delay = 700) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: mid(), from: "agent", text, at: Date.now(), actions }]);
      setTyping(false);
    }, delay);
  }, []);

  const eligibleActions = useCallback(() =>
    ordersRef.current.filter(refundEligible).map((o) => ({
      label: `${o.id} · ${productById(o.productId).name} · ${fmt(o.amount)}`, value: `refund:${o.id}`,
    })), []);

  const askOrder = useCallback(() => {
    const acts = eligibleActions();
    if (!acts.length) {
      pushAgent(`None of your orders are inside the ${REFUND_WINDOW_DAYS}-day refund window. Want me to escalate to a human agent for an exception?`,
        [{ label: "Escalate to human", value: "Escalate to a human agent" }]);
      flow.current = null;
      return;
    }
    flow.current = { step: "order" };
    pushAgent(`Sure. These orders are eligible (within ${REFUND_WINDOW_DAYS} days). Which one is it for?`, acts);
  }, [eligibleActions, pushAgent]);

  const askReason = useCallback((orderId: string) => {
    const o = ordersRef.current.find((x) => x.id === orderId);
    if (!o || !refundEligible(o)) {
      pushAgent("That order isn't eligible for a refund. Pick another one?", eligibleActions());
      return;
    }
    flow.current = { step: "reason", orderId };
    pushAgent(`Got it: ${productById(o.productId).name} (${fmt(o.amount)}), ${daysLeft(o)} days left in the window. What's the reason?`,
      refundReasons.map((r) => ({ label: r, value: `reason:${r}` })));
  }, [eligibleActions, pushAgent]);

  const startRefundChat = useCallback((orderId?: string) => {
    setChatOpen(true);
    setMessages((m) => [...m, { id: mid(), from: "customer", at: Date.now(), text: orderId ? `I'd like a refund for ${orderId}` : "I'd like a refund" }]);
    if (orderId) askReason(orderId); else askOrder();
  }, [askOrder, askReason]);

  const sendMessage = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const f = flow.current;
    let display = text;
    if (text.startsWith("refund:")) display = `Refund for ${text.slice(7)}`;
    if (text.startsWith("reason:")) display = text.slice(7);
    if (text === "confirm:yes") display = "Submit request";
    if (text === "confirm:no") display = "Cancel";
    setMessages((m) => [...m, { id: mid(), from: "customer", at: Date.now(), text: display }]);
    const t = text.toLowerCase();

    if (text.startsWith("refund:")) return askReason(text.slice(7));

    if (text.startsWith("reason:") && f?.orderId) {
      const reason = text.slice(7);
      const o = ordersRef.current.find((x) => x.id === f.orderId)!;
      flow.current = { step: "confirm", orderId: f.orderId, reason };
      return pushAgent(`To confirm: refund ${fmt(o.amount)} for ${o.id} (${productById(o.productId).name}), reason "${reason}". Submit it?`,
        [{ label: "Submit request", value: "confirm:yes" }, { label: "Cancel", value: "confirm:no" }]);
    }

    if (text.startsWith("confirm:")) {
      if (text === "confirm:yes" && f?.step === "confirm" && f.orderId && f.reason) {
        requestRefund(f.orderId, f.reason, "Chat");
        flow.current = null;
        return pushAgent(`Done. Refund request submitted for ${f.orderId}. Our billing team reviews within 2 business days and you'll get an email. You can track it under Refunds.`,
          [{ label: "Anything else?", value: "That's all, thanks" }]);
      }
      flow.current = null;
      return pushAgent("No problem, I've cancelled that. Anything else I can help with?");
    }

    if (/refund|money back|cancel.*(order|purchase)|return/.test(t)) {
      if (/policy|how long|window|days|eligible/.test(t))
        return pushAgent(`You can request a refund within ${REFUND_WINDOW_DAYS} days of purchase for any product or service. Requests are reviewed within 2 business days, and approved refunds go back to the original payment method in 5 to 7 days.`,
          [{ label: "Request a refund", value: "I'd like a refund" }]);
      const named = ordersRef.current.find((o) => t.includes(o.id.toLowerCase()));
      return named ? askReason(named.id) : askOrder();
    }
    if (/human|person|escalate|manager/.test(t))
      return pushAgent("Connecting you to a human agent through the Agent Gateway. Someone from the team will join this thread shortly. Your transcript is shared with them.");
    if (/status|track/.test(t)) {
      const open = refunds.filter((r) => r.status === "pending");
      return pushAgent(open.length ? `You have ${open.length} refund request(s) pending: ${open.map((r) => r.id).join(", ")}.` : "You have no pending refund requests.");
    }
    if (/order|purchase|bought|history|invoice/.test(t)) {
      const last = ordersRef.current[0];
      return pushAgent(`Your latest order is ${last.id} (${productById(last.productId).name}, ${fmt(last.amount)}) placed ${daysSince(last.date)} days ago. Full history is under Purchase history.`,
        [{ label: "Request a refund", value: "I'd like a refund" }]);
    }
    const prod = products.find((p) => t.includes(p.name.toLowerCase()) || t.includes(p.name.split(" ")[0].toLowerCase()));
    if (prod)
      return pushAgent(`${prod.name}: ${prod.description} Features: ${prod.features.join(", ")}. ${fmt(prod.price)}/${prod.billing === "one-time" ? "one-time" : prod.billing === "monthly" ? "mo" : "yr"}.`);
    if (/product|offer|service|sell|price|pricing|plan/.test(t))
      return pushAgent(`We offer ${products.length} products: ${products.map((p) => p.name).join(", ")}. Ask about any of them by name for details.`);
    if (/hi|hello|hey/.test(t)) return pushAgent("Hello! What can I help you with today?");
    if (/thank|that's all|bye/.test(t)) return pushAgent("Happy to help. Have a great day!");
    pushAgent("I'm not sure about that one. I can help with products, orders and refunds, or connect you with a human agent.",
      [{ label: "Request a refund", value: "I'd like a refund" }, { label: "Talk to a human", value: "Escalate to a human agent" }]);
  }, [askOrder, askReason, pushAgent, refunds, requestRefund]);

  const value = useMemo<Store>(() => ({
    orders, profile, refunds, messages, typing, chatOpen, setChatOpen,
    saveProfile: setProfile, requestRefund, startRefundChat, sendMessage,
  }), [orders, profile, refunds, messages, typing, chatOpen, requestRefund, startRefundChat, sendMessage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
