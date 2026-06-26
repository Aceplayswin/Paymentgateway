import { Link } from "react-router-dom";
import { showServerSuccessToast } from "../../utils/toast";
import { getApiBaseUrl } from "../../services/api";

// Resolve the public API base shown to merchants. Falls back to the current
// origin when VITE_API_BASE_URL is not set (dev proxy).
const API_BASE = getApiBaseUrl() || (typeof window !== "undefined" ? window.location.origin : "");

function CodeBlock({ code, language = "" }) {
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => showServerSuccessToast("Copied to clipboard."),
      () => {},
    );
  };
  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{language}</span>
        <button type="button" className="link-btn" onClick={copy}>
          Copy
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const nodeSample = `const crypto = require("crypto");

const API_BASE = "${API_BASE}";
const API_KEY = "pk_test_xxxxxxxxxxxx";   // your public Key ID
const API_SECRET = "sk_test_xxxxxxxxxxxx"; // your secret (keep server-side)

async function createOrder() {
  const body = JSON.stringify({
    amount: 500,            // amount in INR
    currency: "INR",
    customerName: "John Doe",
    customerPhone: "9876543210",
    orderId: "ORDER-1001",  // your reference (optional)
    redirectUrl: "https://yoursite.com/payment/return"
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(timestamp + "." + body)
    .digest("hex");

  const res = await fetch(API_BASE + "/api/v1/payment/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      "X-Timestamp": timestamp,
      "X-Signature": signature
    },
    body
  });

  const data = await res.json();
  // data.data.paymentUrl -> redirect your customer here to pay
  console.log(data);
}

createOrder();`;

const curlSample = `# Compute the signature (timestamp + "." + body) with your secret, then:
TS=$(date +%s)
BODY='{"amount":500,"currency":"INR","customerName":"John Doe","customerPhone":"9876543210"}'
SIG=$(printf "%s" "$TS.$BODY" | openssl dgst -sha256 -hmac "$API_SECRET" | awk '{print $2}')

curl -X POST "${API_BASE}/api/v1/payment/orders" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: $API_KEY" \\
  -H "X-Timestamp: $TS" \\
  -H "X-Signature: $SIG" \\
  -d "$BODY"`;

const orderResponse = `{
  "success": true,
  "message": "Order created",
  "data": {
    "orderId": "ORDER-1001",
    "referenceId": "BYTE12341719300000",
    "amount": 500,
    "currency": "INR",
    "status": "created",
    "paymentUrl": "${API_BASE}/api/payments/pay/abc123token",
    "customerName": "John Doe",
    "customerPhone": "9876543210"
  }
}`;

const statusResponse = `{
  "success": true,
  "message": "Payment confirmed.",
  "data": {
    "orderId": "ORDER-1001",
    "referenceId": "BYTE12341719300000",
    "status": "paid",
    "utr": "320012345678"
  }
}`;

function ApiDocsPage() {
  return (
    <section className="api-docs">
      <header className="content-header">
        <div>
          <h1>API Documentation</h1>
          <p>
            Integrate our payment gateway into your website or app with a simple REST API.
            Get your credentials on the <Link to="/developers/api-keys">API Keys</Link> page.
          </p>
        </div>
      </header>

      <div className="ds-card api-docs__card">
        <h2>1. Overview</h2>
        <p>
          You create an <strong>order</strong> from your server, then redirect your customer
          to the returned <code>paymentUrl</code> (our secure hosted checkout). After the
          customer pays, we confirm the payment and redirect them back to your
          <code>redirectUrl</code>. You can also poll the order status from your server.
        </p>
        <p className="muted">
          Base URL: <code>{API_BASE || "https://your-gateway-domain"}</code>
        </p>
      </div>

      <div className="ds-card api-docs__card">
        <h2>2. Authentication</h2>
        <p>Every request to the public API must include three headers:</p>
        <ul>
          <li>
            <code>X-Api-Key</code> — your public Key ID (<code>pk_test_…</code> / <code>pk_live_…</code>).
          </li>
          <li>
            <code>X-Timestamp</code> — current Unix time in seconds. Requests more than
            5 minutes old are rejected (replay protection).
          </li>
          <li>
            <code>X-Signature</code> — a hex <strong>HMAC-SHA256</strong> of the string
            <code>{`${"{timestamp}"}.${"{rawBody}"}`}</code> using your <strong>secret</strong> as the key.
          </li>
        </ul>
        <p className="muted">
          Keep your secret on your server. Never expose it in browser or mobile app code.
        </p>
      </div>

      <div className="ds-card api-docs__card">
        <h2>3. Create an order</h2>
        <p>
          <code className="method method--post">POST</code> <code>/api/v1/payment/orders</code>
        </p>
        <h4>Request body</h4>
        <ul>
          <li><code>amount</code> (number, required) — amount in INR.</li>
          <li><code>currency</code> (string) — defaults to <code>INR</code>.</li>
          <li><code>customerName</code> (string, required).</li>
          <li><code>customerPhone</code> (string) — 10-digit mobile.</li>
          <li><code>orderId</code> (string) — your own reference (optional).</li>
          <li><code>redirectUrl</code> (string) — where to send the customer after payment.</li>
        </ul>

        <h4>Example — Node.js</h4>
        <CodeBlock code={nodeSample} language="javascript" />

        <h4>Example — cURL</h4>
        <CodeBlock code={curlSample} language="bash" />

        <h4>Response</h4>
        <CodeBlock code={orderResponse} language="json" />
        <p className="muted">
          Redirect your customer to <code>data.paymentUrl</code> to complete payment on our
          hosted checkout. We never expose the underlying processor to you or your customers.
        </p>
      </div>

      <div className="ds-card api-docs__card">
        <h2>4. Check order status</h2>
        <p>
          <code className="method method--get">GET</code> <code>/api/v1/payment/orders/:orderId</code>
        </p>
        <p>
          Use the same authentication headers (sign an empty body). <code>status</code> is one
          of <code>created</code>, <code>paid</code>, <code>failed</code>, or <code>refunded</code>.
        </p>
        <CodeBlock code={statusResponse} language="json" />
      </div>

      <div className="ds-card api-docs__card">
        <h2>5. Payment confirmation</h2>
        <p>
          When a payment succeeds, the transaction appears in your dashboard under
          <strong> PayIn → Transactions</strong> and counts toward your reports and
          settlements automatically. If you configured a webhook URL for your account,
          we will also notify your server (signed) when the payment completes.
        </p>
      </div>

      <div className="ds-card api-docs__card">
        <h2>Error responses</h2>
        <ul>
          <li><code>401</code> — missing/invalid API key, bad signature, or stale timestamp.</li>
          <li><code>403</code> — your merchant account is not approved for API access.</li>
          <li><code>400</code> — invalid request (e.g. missing amount) or gateway not set up.</li>
        </ul>
      </div>
    </section>
  );
}

export default ApiDocsPage;
