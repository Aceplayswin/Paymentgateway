# Paygate — Payment Gateway Platform

A full‑stack **Payment Gateway (PG)** web platform for online merchants. It lets businesses
sign up, complete KYC, connect a UPI payment provider (PhonePe / BharatPe / Paytm / Google Pay),
collect payments from their customers, and track every rupee through PayIn, Settlement, and
PayOut reporting. A separate **Admin** console approves merchants, reviews KYC, and monitors the
whole platform.

This single document explains the project end‑to‑end — the architecture, the two user roles, and
every page from the public landing page through each operational module. You should be able to
understand the entire product by reading this file alone, without opening the source.

---

## Table of Contents

1. [What the Product Does](#1-what-the-product-does)
2. [The Two User Roles](#2-the-two-user-roles)
3. [Technology Stack](#3-technology-stack)
4. [Repository Layout](#4-repository-layout)
5. [How a User Moves Through the App (Big Picture)](#5-how-a-user-moves-through-the-app-big-picture)
6. [Public Area — Landing & Authentication](#6-public-area--landing--authentication-pages)
7. [Merchant Onboarding Flow](#7-merchant-onboarding-flow)
8. [The Dashboard Shell (Navigation)](#8-the-dashboard-shell-after-login)
9. [Dashboard Home (Admin & Merchant)](#9-dashboard-home)
10. [Gateway Module (Merchant only)](#10-gateway-module--merchant-only)
11. [Merchant Module (Admin only)](#11-merchant-module--admin-only)
12. [PayIn Module](#12-payin-module)
13. [PayOut Module](#13-payout-module)
14. [Reports Module](#14-reports-module)
15. [Profile & Settings](#15-profile--settings)
16. [Hosted Payment Page (Customer-facing)](#16-hosted-payment-page--the-customer-experience)
17. [Backend API Map](#17-backend-api-map)
18. [Data Model (Database Tables)](#18-data-model-database-tables)
19. [Running the Project Locally](#19-running-the-project-locally)
20. [Demo Accounts](#20-demo-accounts)

---

## 1. What the Product Does

A payment gateway sits between a **merchant** (an online business) and its **customers**. When a
customer buys something, the gateway collects the money via UPI, confirms it, and later settles the
balance to the merchant's bank account. Paygate implements this whole lifecycle:

- **PayIn** — money flowing *in* from customers to the merchant (collections).
- **Settlement** — collected money (minus fees and GST) paid out to the merchant's bank.
- **PayOut** — money the merchant sends *out* to third parties (e.g. vendor/beneficiary transfers).
- **Reporting** — sales, revenue, complaints, chargebacks, and reconciliation across all of the above.

The platform is built around real **UPI app automations**. Instead of using a single official
bank rail, each merchant connects their *own* PhonePe / BharatPe / Paytm / Google Pay business
account. Customers pay a dynamic UPI QR code to the merchant's VPA, and the platform confirms the
payment by matching it against the merchant's own transaction history (or a customer‑entered UTR).

> ⚠️ **Note on the payment integrations:** the PhonePe/BharatPe/Paytm/Google‑Pay collection flows
> are *unofficial app automations* (reverse‑engineered from the merchant apps), not the official
> gateway SDKs. They depend on a few external helper services (a checksum signer and a QR renderer)
> documented in [Section 17](#17-backend-api-map).

---

## 2. The Two User Roles

Everything in the app is gated by one of two roles, decided at login:

| Role | Who they are | What they do |
|------|--------------|--------------|
| **Admin** | Platform operator | Approves/rejects merchant sign‑ups, reviews KYC documents, monitors platform‑wide stats, and oversees every PayIn/PayOut record across all merchants. |
| **Merchant** | A business using the gateway | Completes KYC, connects a payment provider, collects payments, and views *only their own* transactions, settlements, payouts, and reports. |

The same pages (PayIn, PayOut, Reports) are shared by both roles, but the **data is scoped**:
admins see the whole platform, merchants see only their own records. The sidebar also changes per
role — merchants get the **Gateway** menu, admins get the **Merchant** management menu.

Role enforcement happens in two places:
- **Frontend** — `RoleProtectedRoute` redirects users away from pages their role can't access.
- **Backend** — auth middleware checks the JWT and filters every query by the merchant's `user_id`.

---

## 3. Technology Stack

**Frontend (`FE/`)** — a single‑page React app:
- **React 19** + **React Router 7** (routing/navigation)
- **Vite 8** (dev server + build tool)
- **Tailwind CSS 4** (styling) with custom CSS modules per area
- **Recharts** (dashboard charts), **Axios** (HTTP), **React Hook Form + Yup** (forms/validation)
- **react-hot-toast / react-toastify / SweetAlert2** (notifications & confirmation dialogs)
- **jsPDF / pdfjs-dist** (KYC summary printing & document preview)
- **lucide-react / react-icons** (icons)

**Backend (`API/`)** — a Node.js REST API:
- **Node.js** + **Express 5** (CommonJS modules)
- **MySQL** via the **mysql2** driver and a raw SQL schema (`schema.sql`) — *no ORM*
- **JWT** (`jsonwebtoken`) access/refresh tokens, **bcrypt** password hashing
- **cookie-parser**, **cors**, **dotenv**, **nodemailer** (OTP/notification email)
- Payment SDKs/automation: `@phonepe-pg/pg-sdk-node`, `paytm-pg-node-sdk`, plus custom provider clients

---

## 4. Repository Layout

```
paygate/
├── Readme.md                 ← this document
├── API/                      ← Node + Express backend
│   ├── server.js             ← app entry point; mounts all routes
│   ├── schema.sql            ← full MySQL schema (15 tables)
│   ├── config/               ← db pool, CORS, gateway/PhonePe config
│   ├── routes/               ← URL → controller mapping (one file per module)
│   ├── controllers/          ← business logic, grouped by module
│   │   ├── auth/  admin/  dashboard/  kyc/  merchant/
│   │   ├── payin/ payout/  reports/  profile/  settings/
│   │   └── payment/          ← UPI provider automations (phonepe, bharatpe, paytm, googlepay)
│   ├── middleware/           ← auth, kyc, merchant guards
│   ├── models/               ← thin data-access modules per table
│   ├── utils/                ← formatters, mailer, OTP store, analytics helpers
│   ├── uploads/              ← stored KYC document files
│   ├── API_*_CONTRACT.md     ← detailed endpoint contracts (FE, PayIn, PayOut, Reports)
│   └── paygate.postman_collection.json
└── FE/                       ← React frontend
    ├── index.html  vite.config.js
    └── src/
        ├── App.jsx           ← all routes & route guards
        ├── main.jsx          ← React root + providers
        ├── landing/          ← public marketing landing page (15 sections)
        ├── Login/Register/OTP/Forgot/Reset  ← auth screens
        ├── layout/           ← DashboardLayout, Sidebar, Navbar
        ├── pages/            ← every in-app page, grouped by module
        │   ├── Dashboard/ Gateway/ Merchant/ Payin/ Payout/
        │   ├── Profile/ Settings/ onboarding/ legal/ shared/
        ├── components/       ← reusable UI (DataTable, Modal, charts, KYC widgets…)
        ├── services/         ← API client wrappers (auth, kyc, gateway, merchantAdmin)
        ├── context/          ← Theme + Admin notification providers
        └── utils/            ← auth storage, validation, formatting, theme
```

---

## 5. How a User Moves Through the App (Big Picture)

```
                         ┌────────────────────┐
   Visitor lands on  ──► │  Landing Page  (/)  │
                         └─────────┬──────────┘
                                   │ "Sign Up" / "Login"
                  ┌────────────────┴─────────────────┐
                  ▼                                   ▼
         ┌──────────────┐                     ┌──────────────┐
         │  Register    │  ── OTP verify ──►  │   Login      │
         └──────┬───────┘                     └──────┬───────┘
                │                                    │
                ▼                                    ▼
      role decided at login ───────────────┬────────────────────┐
                                            │                    │
                                       ADMIN role          MERCHANT role
                                            │                    │
                                            ▼                    ▼
                                  /dashboard/admin     account status check:
                                  (full platform)      • pending  → Application Under Review
                                                        • approved → KYC not done → /onboarding/kyc
                                                        • KYC submitted → KYC Under Review
                                                        • KYC approved → /dashboard/merchant
```

A merchant cannot reach the live dashboard until their **account is approved by an admin** *and*
their **KYC is approved**. The app routes them to the correct "waiting room" page automatically
based on their current status.

---

## 6. Public Area — Landing & Authentication Pages

These pages are reachable **without logging in**. If an already‑authenticated user visits them,
they are redirected straight to their dashboard.

### 6.1 Landing Page — `/`
The marketing home page (`landing/LandingPage.jsx`). It is composed of 15 stacked sections, each a
separate component:

| Section | Purpose |
|---------|---------|
| **Header** | Top nav bar with logo and Login / Sign‑Up buttons. |
| **Hero** | Headline pitch + primary call‑to‑action. |
| **Trust** | Logos / trust badges of partners. |
| **Features** | Core product capabilities. |
| **Solutions** | Use‑case oriented offerings. |
| **Methods** | Supported payment methods (UPI, cards, etc.). |
| **Developers** | API/integration messaging for developers. |
| **Security** | Compliance & security posture. |
| **Analytics** | Reporting/analytics highlights. |
| **Industries** | Industry verticals served. |
| **Testimonials** | Customer quotes. |
| **Pricing** | Pricing tiers. |
| **FAQ** | Frequently asked questions. |
| **ContactUs** | Contact form / details. |
| **CTA** | Final "get started" call‑to‑action. |
| **Footer** | Links, legal, copyright. |

From here a visitor goes to **Login** or **Register**, or opens the legal pages.

### 6.2 Register — `/register`
New merchant sign‑up form. Collects `firstName`, `lastName`, `email`, `phoneNumber`, `password`.
On submit, the backend creates the user, generates a unique username automatically, and sends an
**OTP** to verify the email. The user is taken to the OTP page.

### 6.3 OTP Verification — `/otp`
Enter the 6‑digit one‑time code sent by email. Used both for **sign‑up verification** and for the
**password‑reset** flow (the page remembers which flow it's in). On success a new merchant account
starts life in `pending` status, awaiting admin approval.

### 6.4 Login — `/login`
Email + password sign‑in (`Login.jsx`). Features:
- Client‑side validation (valid email, password ≥ 8 chars with letters & numbers).
- **Remember me** — stores the email locally for next time.
- On success it saves the JWT access/refresh tokens and user info to `localStorage`, then routes
  the user to the correct destination based on role and onboarding status (see Section 5).
- Links to **Forgot Password**, **Sign Up**, and the legal pages.

### 6.5 Forgot Password — `/forgot-password`
Enter your email to receive a reset OTP. Calls `POST /api/auth/forgot-password`.

### 6.6 Reset Password — `/reset-password`
After verifying the reset OTP, set a new password. Calls `POST /api/auth/reset-password`.

### 6.7 Legal Pages — `/terms` and `/privacy`
Static **Terms & Conditions** and **Privacy Policy** documents, rendered from content in
`data/legalContent.js`. Linked from the login/register screens.

---

## 7. Merchant Onboarding Flow

After a merchant logs in, they are funneled through onboarding gates before they can use the
gateway. The app picks the right page automatically from the merchant's `accountStatus` and
`kycStatus`.

### 7.1 Application Under Review — `/application-under-review`
Shown when the merchant's account is **pending** admin approval. A friendly "we're reviewing your
application" waiting screen with a logout option. The merchant stays here until an admin approves
(or rejects) them.

### 7.2 KYC Verification — `/onboarding/kyc`
Shown once the account is **approved** but KYC has **not started**. This is a **5‑step wizard**
(`KycVerificationPage.jsx`) that activates the gateway:

| Step | What's collected |
|------|------------------|
| **1. Personal Information** | Full name, date of birth, gender, nationality, residential address, city, state, PIN code, plus the primary **ID type & number** (Aadhaar/PAN/etc.). |
| **2. Business Information** | Legal business name, business type (E‑commerce/Retail/SaaS/Services/Other), GSTIN, business PAN (optional), registered address, website (optional). |
| **3. Documents Upload** | Upload the identity document (front/back as applicable) plus a set of required supporting documents. |
| **4. Bank Account Details** | Account holder, bank name, IFSC, account number, account type (current/savings), and a passbook upload. |
| **5. Verify Your Details** | A read‑only review summary of everything entered, with document previews. The merchant must tick a confirmation checkbox before submitting; they can also print/save the summary. |

The wizard **auto‑saves a draft** every time the user moves between steps (and on demand via "Save
Draft"), so progress is never lost. On submit, the KYC goes to **`submitted`** status and the
merchant is sent to the KYC Under Review page.

### 7.3 KYC Under Review — `/kyc-under-review`
Shown while a submitted KYC awaits admin review. Another waiting room; once an admin approves the
KYC, the merchant gains full access to the dashboard.

---

## 8. The Dashboard Shell (After Login)

Every authenticated in‑app page renders inside `DashboardLayout`, which provides a consistent
frame:

- **Sidebar** (`layout/Sidebar.jsx`) — the left navigation. It is **role‑aware**: menu items are
  filtered by role, collapsible section groups, and some items show **notification badges** (e.g.
  pending merchant requests / KYC requests for admins). It can collapse to an icon rail.
- **Navbar** (`layout/Navbar.jsx`) — the top bar with search, **theme toggle** (light/dark), a
  **notification bell**, and a **profile menu** (links to Profile, Settings, Logout).

**Sidebar menu structure:**

| Group | Items | Visible to |
|-------|-------|-----------|
| **Dashboard** | Dashboard | Admin + Merchant |
| **GATEWAY** | UPI Gateway · Connect Gateway · Collect Payment | Merchant only |
| **MERCHANT** | New Request · KYC Requests · All Merchant | Admin only |
| **PAYIN** | Transactions · Summary · Refund Callback · Settlements · Sales Report · Chargebacks & Liens · Complaints | Admin + Merchant |
| **PAYOUT** | Transactions · IP Whitelist · Ledger · Balance | Admin + Merchant |
| **REPORTS** | Reports | Admin + Merchant |

---

## 9. Dashboard Home

Route: `/dashboard/admin` (admin) or `/dashboard/merchant` (merchant). Both render the same
`pages/Dashboard/Home.jsx`, but the data differs by role. Data comes from a single call:
`GET /api/dashboard/summary`.

**It shows:**
- **Stat cards** at the top:
  - *Admin* (7 cards): Today's Collection, Monthly Revenue, Successful Payments, Failed Payments,
    Active Merchants, System SLA, Open Complaints.
  - *Merchant* (8 cards): the above plus Pending Settlements, Available Balance, Refund Requests,
    Settlement Success Rate (scoped to that merchant).
- **Charts** (Recharts): Revenue Overview, Transaction Volume, Payment Method Mix,
  Success vs Failure, Settlement Trend, Monthly Revenue.
- **Recent Transactions** table — the latest payments with customer, merchant, amount, method,
  status, and timestamp.

Admin charts are scaled up (≈2.4× revenue / 3.2× volume) to represent platform‑wide totals.

---

## 10. Gateway Module — Merchant Only

This is where a merchant connects their payment provider and starts collecting money.

### 10.1 UPI Gateway — `/gateway`
Manages **UPI VPA entries** (`GatewayPage.jsx`). The merchant registers a business mobile number
against a UPI platform (e.g. BharatPe). The page can:
- **Look up** a UPI ID for a business mobile + platform (`POST /api/payments/gateway/upi/lookup`).
  For BharatPe it uses the merchant's stored session to auto‑discover the VPA (`...@fbpe`).
- **List / Add** entries, **toggle** an entry active/inactive, and **delete** entries.

Each entry looks like `{ businessMobileNumber, upiPlatformId, upiId, status }`.

### 10.2 Connect Gateway — `/gateway/connect`
The provider onboarding screen (`ConnectGatewayPage.jsx`). The merchant picks one of four
providers, each with its own connect flow:

| Provider | Connect method | Flow |
|----------|----------------|------|
| **PhonePe** | OTP login | Enter the PhonePe Business mobile → receive OTP → verify → pick a store. Activates the gateway. |
| **BharatPe** | Credentials | Paste the BharatPe merchant session (token + cookie + MID). The session is live‑validated and the UPI ID auto‑discovered. |
| **Paytm** | MID | Enter the Paytm Merchant ID (MID) and UPI VPA. |
| **Google Pay** | Instance | Issues an `instanceId`/`instanceSecret` for an SMS forwarder that reports incoming credit SMS. |

A merchant can also set a **callback (webhook) URL** that the platform fires when a payment is
confirmed.

### 10.3 Collect Payment — `/gateway/collect`
Creates a payment order against an active gateway (`CollectPaymentPage.jsx`):
- Choose a connected provider, enter customer name, phone, amount, optional order ID.
- The backend creates the order and returns a **UPI QR code / payment URL** plus a hosted payment
  link the customer can open.
- The page then **polls the order status**:
  - **PhonePe / Paytm** auto‑confirm by matching the merchant's transaction history.
  - **BharatPe / Google Pay** are *UTR providers* — the customer must enter a 12‑digit UTR on the
    hosted page to confirm.
- On success a toast confirms the payment and the merchant's webhook (if set) is fired.

---

## 11. Merchant Module — Admin Only

The admin's tools for managing merchants who sign up.

### 11.1 New Request — `/merchant/new-request`
Lists **pending merchant sign‑ups** awaiting account approval (`NewRequest.jsx`). The admin can
**approve** (merchant can then start KYC) or **reject** (with a reason). Shows a sidebar badge
count of pending requests. Backed by
`GET /api/auth/admin/merchants/pending` and the approve/reject PATCH endpoints.

### 11.2 KYC Requests — `/merchant/kyc-requests`
Lists merchants who have **submitted KYC** for review (`KycRequests.jsx`). Each row links to a
detail page. The admin can approve or reject directly from the list (with SweetAlert confirmation
dialogs) or open the detail page first. Also drives a sidebar badge count.

### 11.3 KYC Review Detail — `/merchant/kyc-review/:email`
Full review of one merchant's KYC submission (`AdminKycDetailPage.jsx`): all personal, business,
and bank fields plus every uploaded document with previews. From here the admin **approves** (KYC
becomes approved → merchant unlocked) or **rejects** with a reason.

### 11.4 All Merchant — `/merchant/all`
The complete merchant directory (`AllMerchants.jsx`) — every merchant with their account status,
KYC status, and key details. Backed by `GET /api/auth/admin/merchants/manager`.

---

## 12. PayIn Module

"PayIn" = money coming **in** from customers. Shared by admin (all merchants) and merchant (own
data only). Most pages are paginated tables with search/filter; some are summary‑card pages.

| Page | Route | What it shows | API |
|------|-------|---------------|-----|
| **Transactions** | `/payin/transactions` | Every incoming payment: txn ID, order ID, customer, merchant, amount, method, status, timestamp. Filter by status (success/failed/pending/refunded) and search. | `GET /api/payin/transactions` |
| **Summary** | `/payin/summary` | Snapshot cards: Payment Success Rate, Revenue, Settlement, Volume, Avg Ticket. | `GET /api/payin/summary` |
| **Refund Callback** | `/payin/refund-callback` | Refund events (transactions in `refunded` state): refund ID, callback ID, amount, status, time. | `GET /api/payin/refund-callbacks` |
| **Settlements** | `/payin/settlements` | Payouts of collected money to the merchant's bank: gross, fees, GST, net settlement, status (settled/processing/failed), date, merchant. | `GET /api/payin/settlements` |
| **Sales Report** | `/payin/sales-report` | Daily/Weekly/Monthly sales cards + payment‑mix + a transaction‑volume chart. | `GET /api/payin/sales-report` |
| **Chargebacks & Liens** | `/payin/chargebacks-liens` | Disputes of type chargeback/lien: dispute ID, txn ID, reason, status, priority, notes. | `GET /api/payin/chargebacks-liens` |
| **Complaints** | `/payin/complaints` | Customer/merchant complaints: complaint ID, merchant, issue type, priority, status (open/under‑review/resolved), timeline. | `GET /api/payin/complaints` |

The shared `DataTable`, `Pagination`, `TableToolbar`, and `FilterPanel` components power the list
pages, giving consistent search, status filters, and paging across the module.

---

## 13. PayOut Module

"PayOut" = money going **out** (vendor/beneficiary transfers) plus the merchant's balance ledger.

| Page | Route | What it shows | API |
|------|-------|---------------|-----|
| **Transactions** | `/payout/transactions` | Outgoing transfers: payout ID, beneficiary name, bank details, merchant, amount, status (processed/pending/failed), time. | `GET /api/payout/transactions` |
| **IP Whitelist** | `/payout/ip-whitelist` | IP addresses allowed to trigger payouts via API, with enabled/disabled status and added date. Supports add (`POST`) and edit (`PATCH`). | `GET /api/payout/ip-whitelist` |
| **Ledger** | `/payout/ledger` | Running account ledger: entry ID, credit/debit type, running balance, reference ID, merchant, time. | `GET /api/payout/ledger` |
| **Balance** | `/payout/balance` | Three balance cards: Available Balance, Pending Balance, Settlement Balance. | `GET /api/payout/balance` |

For admins the data is platform‑wide; for merchants it is filtered to their own `user_id`.

---

## 14. Reports Module

Route: `/payin/reports` (label "REPORTS" in the sidebar). The **Report Center** page presents
report categories — Transaction Reports, Settlement Reports, Revenue Reports, Merchant Reports —
ready for CSV/PDF export, reconciliation, and merchant performance coverage. It is backed by
`GET /api/reports/center` (legacy alias `GET /api/payin/reports`).

Related report endpoints (also surfaced via PayIn pages and a combined call):
- `GET /api/reports/sales` — sales cards + volume chart (also `/payin/sales-report`).
- `GET /api/reports/merchant` — merchant revenue‑overview chart.
- `GET /api/reports/summary` — all report data in one call.

---

## 15. Profile & Settings

### 15.1 Profile — `/profile`
The logged‑in user's profile (`ProfilePage.jsx`): full name, phone, job title, department, bio,
location, avatar, date of birth. Editable; saved via `GET/PATCH /api/profile`.

### 15.2 Settings — `/settings`
General account settings (`SettingsPage.jsx`) — preferences and general configuration, rendered
through the shared `SettingsLayout` with the `GeneralSettingsContent` panel.

### 15.3 Security Settings — `/settings/security`
Security‑focused settings (`SecuritySettingsPage.jsx`) such as password/security controls
(`SecuritySettingsContent` panel). The legacy `/security-center` route redirects here.

---

## 16. Hosted Payment Page — the Customer Experience

Route: `/pay/:linkToken` (`HostedPaymentPage.jsx`). This is the **only in‑app page meant for the
merchant's *customers*, not the merchant** — it is public and needs no login.

When a merchant creates a payment in **Collect Payment**, the platform generates a hosted link
(valid ~5 minutes). The customer opens it and sees:
- The order amount and a fresh **UPI QR code** to scan with any UPI app, paying directly to the
  merchant's VPA.
- For **UTR providers (BharatPe / Google Pay)** a field to enter the 12‑digit UTR after paying, so
  the platform can confirm the credit.

Confirmation/trust model per provider:
- **PhonePe** — backend polls PhonePe's transaction list and matches transaction ID + amount.
- **Paytm** — backend polls Paytm's order‑status endpoint and matches MID + order ID + amount.
- **BharatPe** — customer's UTR is matched against the merchant's transactions (duplicate UTRs
  rejected).
- **Google Pay** — customer's UTR is matched against today's bank credit SMS forwarded to the
  platform.

On success the order is marked `success`, the UTR is stored, and the merchant's webhook fires.

---

## 17. Backend API Map

The Express server (`API/server.js`) mounts these route groups. Every protected route expects an
`Authorization: Bearer <accessToken>` header.

| Mount point | Module | Highlights |
|-------------|--------|-----------|
| `/api/auth` | Auth, onboarding, admin merchant mgmt | register, verify‑otp, login, me, refresh, forgot/reset password, merchant onboarding status, admin approve/reject merchants. |
| `/api/kyc` | KYC | status, draft, submit; admin requests / approve / reject. |
| `/api/dashboard` | Dashboard | `summary` (stats + charts + recent txns, role‑scoped). |
| `/api/payin` | PayIn | transactions, summary, refund‑callbacks, settlements, sales‑report, chargebacks‑liens, complaints, reports. |
| `/api/payout` | PayOut | balance, transactions, ledger, ip‑whitelist. |
| `/api/reports` | Reports | center, sales, merchant, summary. |
| `/api/payments` | Payment automations | gateway UPI CRUD; per‑provider connect (phonepe/bharatpe/paytm/googlepay); initiate, status, hosted `pay/:linkToken`, payment‑verify, googlepay ingest‑sms. |
| `/api/profile` | Profile | get / patch profile. |
| `/api/settings` | Settings | ip‑whitelist read/write. |
| `/api/transactions` | Legacy aliases | older envelope versions of several PayIn/PayOut lists. |

**Response envelope.** Most endpoints return a standard envelope:
```json
{ "code": 200, "success": true, "status": "success", "message": "...",
  "data": {}, "timestamp": 1718448000, "method": "GET", "endpoint": "/api/..." }
```
List endpoints add a `pagination` object: `{ page, limit, total, totalPages }`.

**External dependencies for the payment automations** (overridable via `.env`):

| Env var | Purpose |
|---------|---------|
| `PHONEPE_CHECKSUM_URL` | Remote signer for PhonePe's `x-request-sdk-checksum` header. |
| `UPI_QR_SERVICE_URL` | Renders a `upi://pay` string into a base64 PNG QR. |
| `PAYTM_STATUS_URL` | Paytm order‑status endpoint. |
| `PUBLIC_BASE_URL` | Base URL used to build the hosted payment link. |
| `PHONEPE_TLS_INSECURE` | Set `true` to disable TLS verification for PhonePe's edge. |

> The detailed request/response shapes live in `API/API_FE_CONTRACT.md`,
> `API_PAYIN_CONTRACT.md`, `API_PAYOUT_CONTRACT.md`, and `API_REPORTS_CONTRACT.md`. A ready‑to‑use
> Postman collection is in `API/paygate.postman_collection.json`.

---

## 18. Data Model (Database Tables)

The schema (`API/schema.sql`) defines 15 MySQL tables:

| Table | Purpose |
|-------|---------|
| `users` | Accounts (admin & merchant); role, approval status, hashed password, generated username. |
| `user_sessions` | Persisted refresh‑token sessions with IP/user‑agent metadata. |
| `user_profiles` | Extended profile fields (job title, bio, avatar, etc.). |
| `merchant_kyc` | KYC draft + submission data and review status per merchant. |
| `gateway_upi_entries` | Registered business‑mobile → UPI VPA entries (active/inactive). |
| `merchant_gateway_configs` | Per‑merchant provider connection config & session (JSON), webhook URL. |
| `payin_transactions` | Incoming payments (source for transactions, summary, refunds, charts). |
| `payment_links` | Hosted payment‑page links with expiry. |
| `googlepay_transactions` | Bank credit SMS ingested for Google Pay UTR matching. |
| `settlements` | Settlement of collected money to merchant banks (gross/fees/GST/net). |
| `disputes` | Chargebacks, liens, and complaints. |
| `payout_transactions` | Outgoing beneficiary transfers. |
| `payout_balance` | Available / pending balance per merchant. |
| `ledger` | Credit/debit ledger with running balance. |
| `ip_whitelist` | IPs permitted to trigger payouts. |

---

## 19. Running the Project Locally

You need **Node.js** and a running **MySQL** instance.

### Backend (`API/`)
```bash
cd API
npm install
# 1. Create a MySQL database and import the schema:
#    mysql -u <user> -p <dbname> < schema.sql
# 2. Copy .env.example → .env and fill in DB, JWT, SMTP, and gateway values.
npm run seed:demo   # seeds an admin, demo merchants, and dashboard transactions
npm run dev         # starts the API (nodemon) on the PORT from .env
```

### Frontend (`FE/`)
```bash
cd FE
npm install
# Copy .env.example → .env and set VITE_API_BASE_URL (e.g. http://localhost:3000)
npm run dev         # starts the Vite dev server
```

Open the printed Vite URL in your browser. Build for production with `npm run build`.

---

## 20. Demo Accounts

After running `npm run seed:demo`, log in with:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@paygate.com` | `Test@1234` |
| **Merchant** (Acme Retail) | `acme.retail@example.com` | `Test@1234` |
| **Merchant** (Urban Cart) | `urban.cart@example.com` | `Test@1234` |

Log in as the admin to see the platform‑wide dashboard and merchant management; log in as a
merchant to see scoped data and the Gateway module.

---

*This document describes the full Paygate platform — its roles, onboarding gates, and every
operational page across the Gateway, Merchant, PayIn, PayOut, and Reports modules — so the project
can be understood without reading the source code.*
