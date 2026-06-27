// DummyMart storefront: cart + inline Razorpay checkout against the Paygate gateway.
//
// The store authenticates to Paygate with its MERCHANT API KEY (server-side) —
// the key identifies the merchant and routes the order to that merchant's
// Razorpay account. The server fetches the per-order checkout payload and hands
// it to the browser, which opens the Razorpay widget inline. The browser never
// sees the merchant keys.

const PRODUCTS = [
  { id: "p1", name: "Wireless Earbuds", emoji: "🎧", price: 1499, desc: "Noise-cancelling, 24h battery." },
  { id: "p2", name: "Smart Watch", emoji: "⌚", price: 2999, desc: "Heart-rate + GPS tracking." },
  { id: "p3", name: "Mechanical Keyboard", emoji: "⌨️", price: 3499, desc: "Hot-swappable, RGB." },
  { id: "p4", name: "Desk Lamp", emoji: "💡", price: 899, desc: "Adjustable warm/cool light." },
  { id: "p5", name: "Coffee Mug", emoji: "☕", price: 299, desc: "Ceramic, 350ml." },
  { id: "p6", name: "Backpack", emoji: "🎒", price: 1999, desc: "Water-resistant, laptop sleeve." },
];

const cart = new Map(); // id -> qty
const inr = (n) => `₹${Number(n).toFixed(2)}`;

const $ = (sel) => document.querySelector(sel);
const productsEl = $("#products");
const cartItemsEl = $("#cartItems");
const cartCountEl = $("#cartCount");
const cartTotalEl = $("#cartTotal");
const payBtn = $("#payBtn");
const formMsg = $("#formMsg");

function cartTotal() {
  let total = 0;
  for (const [id, qty] of cart) {
    const p = PRODUCTS.find((x) => x.id === id);
    total += p.price * qty;
  }
  return total;
}

function renderProducts() {
  productsEl.innerHTML = PRODUCTS.map(
    (p) => `
    <div class="card">
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <div class="desc">${p.desc}</div>
      <div class="price">${inr(p.price)}</div>
      <button data-add="${p.id}">Add to cart</button>
    </div>`
  ).join("");
}

function renderCart() {
  const count = [...cart.values()].reduce((a, b) => a + b, 0);
  cartCountEl.textContent = count;

  if (cart.size === 0) {
    cartItemsEl.innerHTML = `<p class="empty">Your cart is empty.<br/>Add a product to get started.</p>`;
  } else {
    cartItemsEl.innerHTML = [...cart.entries()]
      .map(([id, qty]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        return `
        <div class="cart-row">
          <span style="font-size:22px">${p.emoji}</span>
          <span class="name">${p.name}<br/><small style="color:#97a0bd">${inr(p.price)}</small></span>
          <span class="qty">
            <button data-dec="${id}">−</button>
            <span>${qty}</span>
            <button data-inc="${id}">+</button>
          </span>
        </div>`;
      })
      .join("");
  }

  const total = cartTotal();
  cartTotalEl.textContent = inr(total);
  payBtn.textContent = `Pay ${inr(total)}`;
  payBtn.disabled = total <= 0;
}

// --- cart interactions ------------------------------------------------------

document.addEventListener("click", (e) => {
  const add = e.target.getAttribute?.("data-add");
  const inc = e.target.getAttribute?.("data-inc");
  const dec = e.target.getAttribute?.("data-dec");
  if (add) cart.set(add, (cart.get(add) || 0) + 1);
  if (inc) cart.set(inc, (cart.get(inc) || 0) + 1);
  if (dec) {
    const next = (cart.get(dec) || 0) - 1;
    if (next <= 0) cart.delete(dec);
    else cart.set(dec, next);
  }
  if (add || inc || dec) renderCart();
});

// --- drawer -----------------------------------------------------------------

const drawer = $("#drawer");
const overlay = $("#overlay");
const openDrawer = () => {
  drawer.classList.add("show");
  overlay.classList.add("show");
};
const closeDrawer = () => {
  drawer.classList.remove("show");
  overlay.classList.remove("show");
};
$("#cartBtn").addEventListener("click", openDrawer);
$("#closeDrawer").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

// --- checkout + Razorpay ----------------------------------------------------

function setMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className = "form-msg" + (type ? " " + type : "");
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

$("#checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const total = cartTotal();
  if (total <= 0) return;

  const form = new FormData(e.target);
  const customerName = form.get("customerName");
  const customerPhone = form.get("customerPhone");
  const items = [...cart.entries()].map(([id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return { id, name: p.name, qty, price: p.price };
  });

  payBtn.disabled = true;
  setMsg("Creating your order with Paygate…", null);

  let checkoutData;
  try {
    checkoutData = await postJSON("/demo-store/api/checkout", {
      customerName,
      customerPhone,
      amount: total,
      items,
    });
  } catch (err) {
    setMsg(err.message, "error");
    payBtn.disabled = false;
    return;
  }

  const { orderId, checkout, byteTransactionId } = checkoutData;

  if (!checkout || !checkout.key || !checkout.order_id) {
    setMsg("Gateway did not return a checkout payload.", "error");
    payBtn.disabled = false;
    return;
  }

  setMsg("Opening secure payment…", "ok");

  const rzp = new Razorpay({
    key: checkout.key,
    order_id: checkout.order_id,
    amount: checkout.amount,
    currency: checkout.currency || "INR",
    name: checkout.name || "DummyMart",
    description: checkout.description || `Order ${orderId}`,
    prefill: checkout.prefill || { name: customerName, contact: customerPhone },
    notes: checkout.notes || {},
    theme: { color: "#5b8cff" },
    handler: async (response) => {
      setMsg("Verifying payment…", "ok");
      try {
        await postJSON("/demo-store/api/verify", {
          orderId,
          byteTransactionId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err) {
        // Verification failure is non-fatal; the result page re-checks status.
        console.warn("verify error:", err.message);
      }
      window.location.href = `/demo-store/result?orderId=${encodeURIComponent(orderId)}`;
    },
    modal: {
      ondismiss: () => {
        setMsg("Payment cancelled. You can try again.", "error");
        payBtn.disabled = false;
      },
    },
  });

  rzp.on("payment.failed", (resp) => {
    setMsg(`Payment failed: ${resp.error?.description || "unknown error"}`, "error");
    payBtn.disabled = false;
  });

  rzp.open();
});

renderProducts();
renderCart();
