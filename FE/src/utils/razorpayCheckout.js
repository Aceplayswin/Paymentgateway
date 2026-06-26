const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay checkout failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Razorpay Standard Checkout using the payload returned by the API.
 * Resolves with { razorpayOrderId, razorpayPaymentId, razorpaySignature } on success.
 */
export async function openRazorpayCheckout(checkout, { onDismiss } = {}) {
  if (!checkout?.key || !checkout?.order_id) {
    throw new Error("Invalid Razorpay checkout payload");
  }

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: checkout.key,
      amount: checkout.amount,
      currency: checkout.currency || "INR",
      name: checkout.name,
      description: checkout.description,
      order_id: checkout.order_id,
      prefill: checkout.prefill || {},
      notes: checkout.notes || {},
      handler(response) {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          onDismiss?.();
          reject(new Error("Payment cancelled"));
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
