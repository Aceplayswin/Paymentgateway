function AuthPromoIllustration() {
  return (
    <svg
      className="login-promo__illustration"
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Payment dashboard preview"
    >
      <defs>
        <linearGradient id="authPromoBg" x1="0" y1="0" x2="480" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(37, 99, 235, 0.14)" />
          <stop offset="1" stopColor="rgba(96, 165, 250, 0.04)" />
        </linearGradient>
        <linearGradient id="authPromoCard" x1="120" y1="70" x2="360" y2="290" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f8fbff" />
        </linearGradient>
        <linearGradient id="authPromoAccent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="authPromoPhone" x1="332" y1="118" x2="412" y2="278" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#112d7a" />
        </linearGradient>
        <filter id="authPromoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#2563eb" floodOpacity="0.16" />
        </filter>
        <filter id="authPromoFloatShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect className="login-promo__illustration-bg" width="480" height="400" rx="28" fill="url(#authPromoBg)" />

      <circle cx="240" cy="205" r="148" className="login-promo__illustration-ring" strokeWidth="1.5" />
      <circle cx="240" cy="205" r="112" className="login-promo__illustration-ring login-promo__illustration-ring--inner" strokeWidth="1" />

      <g filter="url(#authPromoShadow)">
        <rect
          className="login-promo__illustration-card"
          x="88"
          y="92"
          width="272"
          height="214"
          rx="18"
          fill="url(#authPromoCard)"
        />
      </g>

      <rect x="108" y="112" width="72" height="10" rx="5" fill="#dbeafe" />
      <rect x="108" y="130" width="132" height="14" rx="7" fill="#1e3a8a" opacity="0.88" />
      <rect x="108" y="152" width="96" height="8" rx="4" fill="#94a3b8" opacity="0.55" />

      <rect x="108" y="178" width="112" height="96" rx="14" fill="#eff6ff" />
      <text x="120" y="204" fill="#64748b" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
        Total Volume
      </text>
      <text x="120" y="236" fill="#0f172a" fontSize="24" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        ₹8.42 Cr
      </text>
      <rect x="120" y="248" width="52" height="18" rx="9" fill="#dcfce7" />
      <text x="132" y="261" fill="#15803d" fontSize="10" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        +18.6%
      </text>

      <rect x="232" y="178" width="112" height="96" rx="14" fill="#eff6ff" />
      <rect x="246" y="232" width="12" height="28" rx="4" fill="#93c5fd" />
      <rect x="264" y="218" width="12" height="42" rx="4" fill="#60a5fa" />
      <rect x="282" y="206" width="12" height="54" rx="4" fill="#2563eb" />
      <rect x="300" y="224" width="12" height="36" rx="4" fill="#3b82f6" />
      <text x="246" y="198" fill="#64748b" fontSize="10" fontFamily="Plus Jakarta Sans, sans-serif">
        Weekly trend
      </text>

      <rect x="108" y="286" width="236" height="8" rx="4" fill="#dbeafe" />
      <rect x="108" y="286" width="168" height="8" rx="4" fill="url(#authPromoAccent)" />

      <g filter="url(#authPromoFloatShadow)">
        <rect x="318" y="118" width="88" height="164" rx="16" fill="url(#authPromoPhone)" />
        <rect x="328" y="128" width="68" height="118" rx="10" fill="#0f172a" opacity="0.18" />
        <rect x="336" y="136" width="52" height="86" rx="8" fill="#ffffff" />
        <circle cx="362" cy="248" r="5" fill="#93c5fd" />
        <rect x="344" y="152" width="36" height="8" rx="4" fill="#2563eb" opacity="0.85" />
        <rect x="344" y="168" width="28" height="6" rx="3" fill="#cbd5e1" />
        <rect x="344" y="182" width="32" height="24" rx="6" fill="#dcfce7" />
        <path
          d="M352 192 L356 198 L368 184"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g filter="url(#authPromoFloatShadow)">
        <rect x="56" y="148" width="118" height="42" rx="21" fill="#10b981" />
        <circle cx="78" cy="169" r="11" fill="rgba(255,255,255,0.22)" />
        <path
          d="M74 169 L77 172 L83 165"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="96" y="174" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
          Payment Received
        </text>
      </g>

      <g filter="url(#authPromoFloatShadow)">
        <rect x="72" y="72" width="92" height="34" rx="17" className="login-promo__illustration-chip" />
        <text x="88" y="94" className="login-promo__illustration-chip-text" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
          UPI · Live
        </text>
      </g>

      <g filter="url(#authPromoFloatShadow)">
        <rect x="286" y="56" width="118" height="34" rx="17" className="login-promo__illustration-chip" />
        <text x="302" y="78" className="login-promo__illustration-chip-text" fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
          T+1 Settlement
        </text>
      </g>

      <ellipse cx="240" cy="352" rx="132" ry="16" fill="rgba(37, 99, 235, 0.12)" />
    </svg>
  );
}

export default AuthPromoIllustration;
