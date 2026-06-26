import { KYC_ID_DOCUMENT_TYPES, KYC_UPLOAD_DOCUMENT_TYPES } from "../../utils/kycValidation";
import KycFieldLabel from "./KycFieldLabel";

function KycDocumentTypeSelect({
  id,
  value,
  onChange,
  required = false,
  label = "Document Type",
  variant = "identity",
}) {
  const options = variant === "upload" ? KYC_UPLOAD_DOCUMENT_TYPES : KYC_ID_DOCUMENT_TYPES;

  return (
    <div>
      <KycFieldLabel htmlFor={id} required={required}>
        {label}
      </KycFieldLabel>
      <select id={id} className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default KycDocumentTypeSelect;
