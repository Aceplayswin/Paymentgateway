function KycFieldLabel({ htmlFor, children, required = false }) {
  return (
    <label className="field-label kyc-field-label" htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="kyc-required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export default KycFieldLabel;
