import type { Order } from "@/lib/data";

const map: Record<Order["status"], [string, string]> = {
  paid: ["Paid", "border-line text-muted"],
  refund_pending: ["Refund pending", "border-yellow-500/50 text-yellow-400"],
  refunded: ["Refunded", "border-accent/50 text-accent"],
  refund_denied: ["Refund denied", "border-red-500/50 text-red-400"],
};

export const StatusTag = ({ status }: { status: Order["status"] }) => (
  <span className={`tag ${map[status][1]}`}>{map[status][0]}</span>
);

export const PageHead = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {children}
  </div>
);
