## What we're building

### 1. API auth — drop API keys, use Device ID + Token
- Remove `api_keys` table from UI (keep table for now, mark deprecated; safe drop later).
- `send-sms` edge function: auth via two headers `X-Device-Id` + `X-Device-Token` (or Basic auth fallback). Token verified against `devices.device_token_hash`. `user_id` derived from the device record.
- Remove the API Keys page from sidebar; replace with **Developers** (docs) page.

### 2. Base URL = `https://simresend.web.app/v1`
- Add `src/lib/api-base.ts` exporting `API_BASE = "https://simresend.web.app/v1"`.
- All docs, QR payload, and example snippets use this URL.
- You configure Firebase Hosting rewrites: `/v1/**` → `https://abjwmllylfdbcmhfqwvk.supabase.co/functions/v1/**` (instructions in docs page).

### 3. Developer documentation page (`/dashboard/developers`)
- **Auth**: headers `X-Device-Id`, `X-Device-Token`.
- **Phone format**: E.164 only (`+254712345678`), regex shown, examples per country.
- **Endpoints** with curl + JS + PHP + Python snippets:
  - `POST /v1/send-sms` (body: `recipient`, `message`)
  - `GET  /v1/messages/:id` (status check)
  - Webhook payload schema
- **Rate limit**: explains 20/day Free, X-RateLimit-* response headers.
- **Error codes** table.

### 4. Rate limiting — 20 messages/day Free, more on paid tiers
- New table `usage_daily(user_id, day, sent_count)` with unique `(user_id, day)`.
- New table `subscriptions(user_id, tier, status, current_period_end, paystack_ref)`.
- DB function `public.check_and_increment_sms_quota(_user_id)` (SECURITY DEFINER) — atomic check + increment, returns `{allowed, remaining, limit, tier}`.
- `send-sms` calls the RPC before queuing; returns 429 with JSON when over quota.
- Quota by tier: Free=20, Starter=200, Pro=1500, Business=5000 (per day).

### 5. Pricing tiers (KES, ≤1000 max)
| Tier | KES / month | SMS / day |
|---|---|---|
| Free | 0 | 20 |
| Starter | 100 | 200 |
| Pro | 500 | 1,500 |
| Business | 1,000 | 5,000 |

- New `/pricing` route + **Upgrade** page in dashboard.
- Currency conversion: client calls `https://api.exchangerate.host/latest?base=KES` and detects user currency via `https://ipapi.co/json/` (free, no key). Displays both KES and local equivalent.

### 6. Paystack payments (live)
- Store keys via `secrets--add_secret`: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (you'll paste rotated keys in the secure form — **rotate the ones you shared in chat first**).
- New tables: `payments(id, user_id, tier, amount_kes, currency, reference, status, expires_at, paid_at)`.
- Edge function `paystack-init` — creates Paystack transaction, returns authorization URL, sets `expires_at = now() + 30min`, status=`pending`.
- Edge function `paystack-verify` — polled from client every 4s after redirect; calls Paystack `/transaction/verify/:ref`; updates `status` to `paid`/`failed`; on `paid` upserts `subscriptions` with 30-day period.
- Edge function `paystack-webhook` — verifies `x-paystack-signature` HMAC SHA-512, processes `charge.success`.
- Background expiry: pg_cron job every minute marks pending payments older than `expires_at` as `expired`.
- Upgrade page: tier cards → click → opens Paystack popup (inline JS) → callback page polls verify endpoint with status: pending → paid/failed/expired countdown.
- **Callback URL**: `https://simresend.web.app/payment/callback`
- **Webhook URL**: `https://simresend.web.app/v1/paystack-webhook`

### 7. Real webhooks for users
- New table `webhook_endpoints(user_id, url, secret, events[], active)`.
- New table `webhook_deliveries(endpoint_id, event, payload, status, attempts, last_error)`.
- Events: `sms.sent`, `sms.delivered`, `sms.failed`.
- DB trigger on `messages` UPDATE → enqueue delivery row when status transitions.
- Edge function `webhook-dispatcher` (pg_cron every minute) — picks pending, POSTs with `X-Webhook-Signature: sha256=...`, retries 3x exponential.
- Webhooks page rewritten: add/edit/delete endpoint, copy signing secret, view recent deliveries.

### 8. UI polish
- Sidebar: replace **API Keys** with **Developers** and **Billing**.
- Add **Upgrade** CTA showing remaining quota (e.g. `12 / 20 today`).
- Pricing cards on landing + dashboard.

---

## Technical layout

**Migrations (single SQL file):**
1. `usage_daily`, `subscriptions`, `payments`, `webhook_endpoints`, `webhook_deliveries` tables + GRANTs + RLS.
2. `check_and_increment_sms_quota(uuid)` function.
3. `enqueue_webhook_delivery()` trigger function + trigger on `messages`.
4. pg_cron jobs: expire-payments, dispatch-webhooks (using `pg_net` to call edge functions with anon key).

**New edge functions:**
- `paystack-init`, `paystack-verify`, `paystack-webhook`
- `webhook-dispatcher`
- Modify `send-sms`: new device-cred auth + quota RPC

**New routes:**
- `src/routes/_authenticated/developers.tsx` (docs)
- `src/routes/_authenticated/billing.tsx` (tiers + upgrade)
- `src/routes/_authenticated/billing.callback.tsx` (post-Paystack polling)
- `src/routes/pricing.tsx` (public)
- Rewrite `src/routes/_authenticated/webhooks.tsx`

**Files removed from nav:** `api-keys.tsx` (page kept, hidden).

---

## What I need from you (in order)
1. **Rotate the Paystack keys** you pasted — they're public in chat. Do it now in Paystack dashboard.
2. After my next message, a secure form will pop asking for `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` — paste the **rotated** values there.
3. On `simresend.web.app` (Firebase Hosting), add this to `firebase.json`:
```json
{ "hosting": { "rewrites": [
  { "source": "/v1/**", "destination": "https://abjwmllylfdbcmhfqwvk.supabase.co/functions/v1/:splat" },
  { "source": "/payment/callback", "destination": "/index.html" }
]}}
```
(Firebase doesn't support cross-origin rewrites natively — you'll likely need a Cloudflare Worker in front, or use Firebase Functions as a thin proxy. I'll include both setups in the docs.)
4. In Paystack dashboard → Settings → API & Webhooks, set:
   - **Callback URL**: `https://simresend.web.app/payment/callback`
   - **Webhook URL**: `https://simresend.web.app/v1/paystack-webhook`

Approve this plan and I'll start with the database migration, then the secrets request, then ship the code in one pass.