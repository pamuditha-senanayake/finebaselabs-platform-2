export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: "Platform" | "Service" | "Add-on";
  price: number;
  billing: "one-time" | "monthly" | "yearly";
  features: string[];
};

export const products: Product[] = [
  { id: "p-core", name: "Findbase Core", tagline: "Unified customer data layer", category: "Platform", price: 49, billing: "monthly",
    description: "A single source of truth for every customer interaction, synced across all of your tools in real time.",
    features: ["Unlimited contacts", "Real-time sync", "REST & webhook API", "99.9% uptime SLA"] },
  { id: "p-insight", name: "Insight Analytics", tagline: "Dashboards without the noise", category: "Platform", price: 89, billing: "monthly",
    description: "Cohort, funnel and retention analytics with a query builder that actually respects your time.",
    features: ["Cohort & funnel reports", "Custom metrics", "Scheduled exports", "Role-based access"] },
  { id: "p-agent", name: "Agent Gateway", tagline: "Connect external support agents", category: "Platform", price: 129, billing: "monthly",
    description: "Bridge outside AI and human agents into the customer chat with scoped, auditable permissions.",
    features: ["Agent handoff protocol", "Scoped tokens", "Audit trail", "Live transcript stream"] },
  { id: "p-vault", name: "Vault Storage", tagline: "Encrypted document storage", category: "Add-on", price: 19, billing: "monthly",
    description: "End-to-end encrypted file storage with versioning and customer-managed keys.",
    features: ["500 GB included", "Version history", "Customer-managed keys", "Granular sharing"] },
  { id: "p-onboard", name: "Onboarding Sprint", tagline: "Two weeks, fully set up", category: "Service", price: 2400, billing: "one-time",
    description: "A dedicated engineer migrates your data, configures workflows and trains your team.",
    features: ["Data migration", "Workflow setup", "2 training sessions", "14-day hypercare"] },
  { id: "p-audit", name: "Security Audit", tagline: "Independent review & report", category: "Service", price: 3900, billing: "one-time",
    description: "A full review of your integration surface with prioritized remediation guidance.",
    features: ["Threat model", "Pen-test of integrations", "Executive summary", "Remediation plan"] },
  { id: "p-support", name: "Priority Support", tagline: "Humans in under 15 minutes", category: "Add-on", price: 299, billing: "yearly",
    description: "Named support engineer, private channel and guaranteed response times.",
    features: ["15-min first response", "Named engineer", "Private channel", "Quarterly reviews"] },
  { id: "p-sso", name: "SSO & SCIM", tagline: "Enterprise identity", category: "Add-on", price: 39, billing: "monthly",
    description: "SAML single sign-on and automated user provisioning for your whole organization.",
    features: ["SAML 2.0", "SCIM provisioning", "Directory sync", "Session policies"] },
];

export const productById = (id: string) => products.find((p) => p.id === id)!;

export type Order = {
  id: string;
  productId: string;
  date: string; // ISO
  amount: number;
  status: "paid" | "refund_pending" | "refunded" | "refund_denied";
  method: string;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const initialOrders: Order[] = [
  { id: "ORD-10482", productId: "p-agent", date: daysAgo(4), amount: 129, status: "paid", method: "Visa •••• 4242" },
  { id: "ORD-10455", productId: "p-vault", date: daysAgo(12), amount: 19, status: "paid", method: "Visa •••• 4242" },
  { id: "ORD-10391", productId: "p-onboard", date: daysAgo(26), amount: 2400, status: "paid", method: "Wire transfer" },
  { id: "ORD-10277", productId: "p-insight", date: daysAgo(41), amount: 89, status: "paid", method: "Visa •••• 4242" },
  { id: "ORD-10102", productId: "p-core", date: daysAgo(74), amount: 49, status: "paid", method: "Visa •••• 4242" },
  { id: "ORD-09876", productId: "p-support", date: daysAgo(130), amount: 299, status: "refunded", method: "Mastercard •••• 8810" },
  { id: "ORD-09511", productId: "p-sso", date: daysAgo(210), amount: 39, status: "paid", method: "Mastercard •••• 8810" },
];

export const REFUND_WINDOW_DAYS = 30;
export const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
export const refundEligible = (o: Order) => o.status === "paid" && daysSince(o.date) <= REFUND_WINDOW_DAYS;
export const daysLeft = (o: Order) => Math.max(0, REFUND_WINDOW_DAYS - daysSince(o.date));

export type Profile = {
  firstName: string; lastName: string; email: string; phone: string;
  company: string; role: string; country: string; timezone: string;
};

export const initialProfile: Profile = {
  firstName: "Amara", lastName: "Fernando", email: "amara.fernando@northwind.io", phone: "+94 77 123 4567",
  company: "Northwind Logistics", role: "Head of Operations", country: "Sri Lanka", timezone: "Asia/Colombo (UTC+5:30)",
};

export type RefundRequest = {
  id: string; orderId: string; reason: string; source: "Purchase history" | "Chat"; date: string;
  status: "pending" | "approved" | "denied";
};

export const initialRefunds: RefundRequest[] = [
  { id: "RF-2204", orderId: "ORD-09876", reason: "Duplicate purchase", source: "Chat", date: daysAgo(118), status: "approved" },
];

export const refundReasons = [
  "Not what I expected", "Duplicate purchase", "Technical issue", "Found a better alternative", "Purchased by mistake", "Other",
];

export const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
