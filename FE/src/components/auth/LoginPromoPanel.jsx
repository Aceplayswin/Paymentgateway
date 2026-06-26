import AuthPromoIllustration from "./AuthPromoIllustration";

function LoginPromoPanel() {
  return (
    <aside className="login-promo" aria-label="Paygate product overview">
      <div className="login-promo__copy">
        <p className="login-promo__eyebrow">Enterprise payment infrastructure</p>
        <h2 className="login-promo__title">One platform for payments, payouts, and growth</h2>
      </div>

      <div className="login-promo__visual" aria-hidden="true">
        <AuthPromoIllustration />
      </div>
    </aside>
  );
}

export default LoginPromoPanel;
