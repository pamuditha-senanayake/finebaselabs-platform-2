# Finebase portal ↔ Hub connector API

All hub endpoints live under `/api/hub/*` and require:

```
Authorization: Bearer <HUB_API_KEY>
Content-Type: application/json
```

Responses are JSON; errors are `{ "error": "..." }` (401 bad key, 404 not found, 409 conflict, 422 rule violation).

## How chat flows

1. Customer types in the portal → `POST /api/portal/chat` stores the message.
2. Hub learns about it in one (or both) of two ways:
   - **Pull:** poll `GET /api/hub/messages?since=<lastSeq>` (cursor = `nextSince` from the previous response).
   - **Push:** set `HUB_WEBHOOK_URL`; the portal POSTs `{ event: "message.created", conversationId, customerId, message }` with header
     `X-Finebase-Signature: sha256=<HMAC-SHA256(body, HUB_WEBHOOK_SECRET)>`.
3. Hub orchestrates its agents, gathers context (endpoints below), then replies with `POST /api/hub/messages`.
4. The customer's browser polls every 2.5 s and shows the reply, optionally with quick-reply buttons.

## Endpoints

| Method & path | Purpose |
|---|---|
| `GET /api/hub/messages?since=0&conversationId=&sender=customer\|agent\|any&limit=100` | New messages after cursor `since` (message `seq`). Returns `{ messages, nextSince }`. |
| `POST /api/hub/messages` `{ conversationId, body, senderName?, actions?: [{label,value}] }` | Send an agent reply. `actions` render as buttons; clicking one sends `value` as the customer's next message. |
| `PATCH /api/hub/messages` `{ ids: [...] }` | Optionally mark messages as received. |
| `GET /api/hub/conversations/:id` | Full context: conversation, customer, orders (with product), refunds, message history. |
| `PATCH /api/hub/conversations/:id` `{ typing?: boolean, status?: "open"\|"closed" }` | Show "Agent is typing…" / close the conversation. |
| `GET /api/hub/customers/:id` | Customer profile, orders, refunds. |
| `GET /api/hub/products?q=` | Product catalog (optional text filter) for product questions. |
| `GET /api/hub/refunds?status=pending&customerId=` | List refund requests. |
| `POST /api/hub/refunds` `{ orderId, reason }` | File a refund for a customer. Enforces: order is `paid` and within 30 days. |
| `POST /api/hub/refunds/:id` `{ status: "approved"\|"denied", note?, decidedBy? }` | Decide a pending refund; updates the order status (`refunded` / `refund_denied`). |

## Quick test

```bash
curl -H "Authorization: Bearer $HUB_API_KEY" "https://YOUR-DOMAIN/api/hub/messages?since=0"
```

## Environment variables (set in Vercel → Settings → Environment Variables)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HUB_API_KEY`, and optionally `HUB_WEBHOOK_URL`, `HUB_WEBHOOK_SECRET`.

## Notes

- The portal has no customer login yet: every browser acts as the seeded customer (`DEMO_CUSTOMER_ID`). Add auth before real customers use it.
- The service role key is server-side only. All tables have row-level security enabled with no public policies, so the browser can't read them directly.
- Vercel serverless can't hold long-lived connections, so the portal uses short polling rather than SSE/WebSockets.
