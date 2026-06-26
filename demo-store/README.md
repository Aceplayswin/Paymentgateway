# DummyMart — Paygate gateway test store

A **standalone dummy merchant website** for testing the Paygate (Ultraconic PG)
payment gateway end-to-end, exactly as a normal customer would: browse products,
add to cart, check out, pay, and land on a result page.

It is completely decoupled from `../FE` and `../API` — it talks to the Paygate
API only over HTTP, so it behaves like a real third-party merchant integrating
the gateway.

It authenticates with a **merchant API key**, not a login. The key pair
**identifies the merchant**: the platform resolves the public key to the owning
merchant and routes the payment to **that merchant's Razorpay account**. The
secret signs every request (HMAC-SHA256), so only the key holder can transact.

```
 Browser (storefront)            DummyMart server                  Paygate API
 ────────────────────            ────────────────                  ───────────
 add to cart, checkout  ──────▶  POST /api/checkout   ──[signed]─▶ POST /api/v1/payment/orders
                                       │               ◀────────── { orderId, referenceId, paymentUrl }
                                       └── fetch payload ─────────▶ GET  /api/payments/pay/:linkToken
 Razorpay Checkout      ◀──────  { checkout payload } ◀────────── { checkout, byteTransactionId }
 pay → handler          ──────▶  POST /api/verify     ──────────▶ POST /api/payments/razorpay/payment-verify
 redirect to /result    ◀──────  status               ◀──[signed] GET  /api/v1/payment/orders/:id
                                                                   (also fires server→server callback)
```

Order creation + status carry the signed headers `X-Api-Key` / `X-Timestamp` /
`X-Signature` (the **merchant key** — see `paygateClient.js`). The per-order
checkout payload and verify use **public** endpoints keyed by the short-lived
link token / `byteTransactionId`, so the browser never sees the merchant keys.

## How it maps to the gateway contract

| Step | DummyMart | Paygate endpoint |
| ---- | --------- | ---------------- |
| Auth | merchant API key + HMAC signature (per request) | `X-Api-Key` / `X-Timestamp` / `X-Signature` headers |
| Create order | `POST /api/checkout` | `POST /api/v1/payment/orders` (key-signed) |
| Fetch checkout | (server-side, during checkout) | `GET /api/payments/pay/:linkToken` (public) |
| Pay | Razorpay Checkout widget (inline) | (Razorpay) |
| Verify | `POST /api/verify` | `POST /api/payments/razorpay/payment-verify` (public) |
| Webhook | `POST/GET /api/paygate-callback` | merchant `callbackUrl` (urlencoded) |
| Status | `GET /api/order/:id` | `GET /api/v1/payment/orders/:orderId` (key-signed) |

> The merchant **key** is what creates and routes the order to the right
> merchant's Razorpay account. The key-signed create response withholds the
> Razorpay payload, so the server fetches it from the per-order hosted link and
> hands only that one order's checkout data to the browser.

## Prerequisites

1. **Paygate API running** (the project in `../API`) on `http://localhost:3000`.
2. An **approved merchant** account on Paygate, and the **platform Razorpay
   account configured by the admin** — otherwise order creation returns
   _"the platform gateway has not been configured by the admin yet"_.
3. **Merchant API keys.** Log in to that merchant's dashboard and generate an
   API key pair (or `POST /api/developer/api-keys/generate`). Copy the
   `keyId` (`pk_test_…`) and the one-time `secret` (`sk_test_…`) into
   `PAYGATE_KEY_ID` / `PAYGATE_KEY_SECRET` in `.env`. **The secret is shown only
   once** — regenerating revokes the previous key.
4. Use Razorpay **test mode** keys on the platform account so you can pay with
   [test cards / UPI](https://razorpay.com/docs/payments/payments/test-card-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV).

## Run it

```bash
cd demo-store
cp .env.example .env      # then edit if needed
npm install
npm start
```

Open **http://localhost:4500**, add items to the cart, hit **Pay**, and complete
the Razorpay test payment. You'll be redirected to the result page, which polls
the order status (covering both the synchronous verify and the async webhook).

## Configuration (`.env`)

| Var | Meaning |
| --- | ------- |
| `PORT` | Port for this store (default `4500`). |
| `STORE_BASE_URL` | Public URL of this store; used to build redirect + callback URLs. |
| `PAYGATE_API_URL` | Base URL of the Paygate API (default `http://localhost:3000`). |
| `PAYGATE_KEY_ID` | Merchant **public** API key (`pk_test_…`); sent as `X-Api-Key`. Identifies the merchant. |
| `PAYGATE_KEY_SECRET` | Merchant **secret** key (`sk_test_…`); signs each request (HMAC). |
| `PAYGATE_PROVIDER` | Gateway provider (`razorpay`). |

> The server→server callback only lands if the gateway can reach
> `STORE_BASE_URL`. For purely local testing the synchronous verify + status
> poll already confirm the payment; to test the real webhook from a remote
> gateway, expose this store via a tunnel (e.g. ngrok) and set `STORE_BASE_URL`
> to the tunnel URL.

## Notes

- Orders are kept **in memory** (`Map`) — this is a test harness, not a real
  store. Restarting the server clears them.
- No database, no build step, no framework on the frontend — just static HTML/JS
  plus a thin Express server and the official Razorpay Checkout script.
