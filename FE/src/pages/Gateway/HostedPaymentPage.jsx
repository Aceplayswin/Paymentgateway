import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getHostedPayment, verifyHostedPayment } from "../../services/gateway";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout";

// Customer-facing payment page (public, no auth). React equivalent of the PHP
// pay_now.php: shows UPI QR or Razorpay Checkout; UTR gateways take a 12-digit
// UTR to confirm, polling gateways auto-confirm.
const POLL_INTERVAL_MS = 5000;

function HostedPaymentPage() {
  const { linkToken } = useParams();
  const [state, setState] = useState({ loading: true, error: "", order: null });
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [result, setResult] = useState(null); // { status, redirectUrl, message }
  const pollRef = useRef(null);

  useEffect(() => {
    let active = true;
    getHostedPayment(linkToken)
      .then((res) => {
        if (active) setState({ loading: false, error: "", order: res.data });
      })
      .catch((err) => {
        if (active)
          setState({ loading: false, error: err?.data?.message || err?.message || "Link not found or expired", order: null });
      });
    return () => {
      active = false;
    };
  }, [linkToken]);

  const order = state.order;

  const applyVerifyResult = useCallback((res) => {
    const data = res.data || {};
    setResult({ status: data.status, redirectUrl: data.redirectUrl, message: res.message });
    if (data.status === "success") {
      clearInterval(pollRef.current);
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2500);
      }
    }
  }, []);

  const runVerify = useCallback(
    async (payload = {}) => {
      if (!order) return;
      setVerifying(true);
      try {
        const res = await verifyHostedPayment(order.gatewayProvider, {
          byteTransactionId: order.byteTransactionId,
          utr: payload.utr,
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId,
          razorpaySignature: payload.razorpaySignature,
        });
        applyVerifyResult(res);
      } catch (err) {
        setResult({ status: "error", message: err?.data?.message || err?.message || "Verification failed" });
      } finally {
        setVerifying(false);
      }
    },
    [order, applyVerifyResult],
  );

  const handleRazorpayCheckout = async () => {
    if (!order?.checkout) return;
    setCheckoutBusy(true);
    try {
      const payment = await openRazorpayCheckout(order.checkout);
      await runVerify(payment);
    } catch (err) {
      if (err?.message !== "Payment cancelled") {
        setResult({ status: "error", message: err?.message || "Payment failed" });
      }
    } finally {
      setCheckoutBusy(false);
    }
  };

  // Polling gateways (phonepe/paytm) auto-confirm by re-checking the backend.
  useEffect(() => {
    if (!order || order.requiresUtr || order.requiresCheckout) return undefined;
    pollRef.current = setInterval(() => runVerify({}), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [order, runVerify]);

  if (state.loading) {
    return <div className="hosted-pay-shell"><div className="hosted-pay-card">Loading payment…</div></div>;
  }

  if (state.error) {
    return (
      <div className="hosted-pay-shell">
        <div className="hosted-pay-card hosted-pay-card--error">{state.error}</div>
      </div>
    );
  }

  const succeeded = result?.status === "success";
  const isRazorpayCheckout = Boolean(order.requiresCheckout && order.checkout);

  return (
    <div className="hosted-pay-shell">
      <div className="hosted-pay-card">
        <header className="hosted-pay-head">
          <strong>{order.payeeName || order.checkout?.name || "Merchant"}</strong>
          <span>Verified business</span>
        </header>

        {succeeded ? (
          <div className="hosted-pay-success">
            <div className="hosted-pay-check" aria-hidden="true">✓</div>
            <h2>Payment Successful</h2>
            {order ? <p>₹{order.amount} paid</p> : null}
            {result.redirectUrl ? <p className="hosted-pay-muted">Redirecting…</p> : null}
          </div>
        ) : (
          <>
            <div className="hosted-pay-amount">₹{order.amount}</div>

            {isRazorpayCheckout ? (
              <>
                <p className="hosted-pay-muted">
                  Pay securely with UPI, cards, netbanking, or wallets via Razorpay.
                </p>
                <button
                  type="button"
                  className="ds-primary-btn hosted-pay-checkout-btn"
                  onClick={handleRazorpayCheckout}
                  disabled={checkoutBusy || verifying}
                >
                  {checkoutBusy ? "Opening checkout…" : "Pay now"}
                </button>
              </>
            ) : order.qrCode ? (
              <img className="hosted-pay-qr" src={order.qrCode} alt="Scan to pay" />
            ) : order.upiUri ? (
              <a className="ds-primary-btn" href={order.upiUri}>Pay in UPI app</a>
            ) : (
              <p className="hosted-pay-muted">QR unavailable. Pay to {order.payeeVpa}</p>
            )}

            {!isRazorpayCheckout ? (
              <p className="hosted-pay-muted">Scan with any UPI app · {order.payeeVpa}</p>
            ) : null}

            {order.requiresUtr ? (
              <div className="hosted-pay-utr">
                <label className="ds-form-field">
                  <span className="ds-form-label">Enter 12-digit UTR after paying</span>
                  <input
                    className="ds-form-input"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="123456789012"
                    inputMode="numeric"
                  />
                </label>
                <button
                  type="button"
                  className="ds-primary-btn"
                  onClick={() => runVerify({ utr })}
                  disabled={verifying || utr.length !== 12}
                >
                  {verifying ? "Confirming…" : "Confirm Payment"}
                </button>
              </div>
            ) : !isRazorpayCheckout ? (
              <p className="hosted-pay-muted">Waiting for payment… this page updates automatically.</p>
            ) : null}

            {result && result.status !== "success" ? (
              <p className="hosted-pay-error">{result.message || "Payment not confirmed yet."}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default HostedPaymentPage;
