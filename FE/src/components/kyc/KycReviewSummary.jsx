import { FiCheckCircle, FiDownload, FiEye, FiPrinter, FiShield } from "react-icons/fi";
import { getFileName } from "../../utils/kycFileHelpers";
import { getDocumentTypeConfig, getUploadDocumentLabel } from "../../utils/kycValidation";
import { downloadKycSummary, getReviewSections, printKycSummary } from "../../utils/kycPrint";
import KycDocumentPreviewCard from "./KycDocumentPreviewCard";

function KycReviewSummary({
  formData,
  email,
  onEditStep,
  detailsConfirmed,
  onDetailsConfirmedChange,
  showToolbar = true,
  readOnly = false,
  bannerTitle = "Verify Your Details",
  bannerDescription = "Please review every field and uploaded document below. Save or print a copy for your records, then confirm and submit when everything is correct.",
}) {
  const sections = getReviewSections(formData);
  const docConfig = getDocumentTypeConfig(formData.identityDocs.idType);
  const documentItems = [
    { label: docConfig.frontLabel, file: formData.identityDocs.idFrontFile },
    ...(docConfig.showBack
      ? [{ label: docConfig.backLabel, file: formData.identityDocs.idBackFile }]
      : []),
    ...(formData.flexibleDocuments || []).map((entry) => ({
      label: getUploadDocumentLabel(entry.documentType),
      file: entry.file,
    })),
    { label: "Bank Passbook", file: formData.bank.passbookFrontFile },
  ].filter((item) => getFileName(item.file));

  return (
    <div className="kyc-review">
      <div className="kyc-verify-banner">
        <div className="kyc-verify-banner__icon" aria-hidden="true">
          <FiShield />
        </div>
        <div>
          <h3>{bannerTitle}</h3>
          <p>{bannerDescription}</p>
        </div>
      </div>

      {showToolbar ? (
        <div className="kyc-verify-toolbar">
          <button
            type="button"
            className="kyc-btn kyc-btn--ghost kyc-verify-toolbar__btn"
            onClick={() => downloadKycSummary(formData, email)}
          >
            <FiDownload aria-hidden="true" />
            Save Details
          </button>
          <button
            type="button"
            className="kyc-btn kyc-btn--ghost kyc-verify-toolbar__btn"
            onClick={() => printKycSummary(formData, email)}
          >
            <FiPrinter aria-hidden="true" />
            Print Details
          </button>
        </div>
      ) : null}

      {sections.map((section, index) => (
        <section key={section.title} className="kyc-review-section">
          <div className="kyc-review-section__header">
            <h3>{section.title}</h3>
            {!readOnly && onEditStep ? (
              <button type="button" className="kyc-review-edit-btn" onClick={() => onEditStep(index + 1)}>
                Edit
              </button>
            ) : null}
          </div>
          <dl className="kyc-review-list">
            {section.items
              .filter((item) => !item.file)
              .map((item) => (
                <div key={item.label} className="kyc-review-list__row">
                  <dt>{item.label}</dt>
                  <dd>{item.value || "—"}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}

      <section className="kyc-review-section">
        <div className="kyc-review-section__header">
          <h3>
            <FiEye aria-hidden="true" /> Uploaded Documents
          </h3>
        </div>
        {documentItems.length ? (
          <div className="kyc-review-docs-grid">
            {documentItems.map((item) => (
              <KycDocumentPreviewCard key={item.label} label={item.label} file={item.file} />
            ))}
          </div>
        ) : (
          <p className="kyc-review__intro">No uploaded documents found in this submission.</p>
        )}
      </section>

      {!readOnly ? (
        <label className="kyc-verify-confirm">
          <input
            type="checkbox"
            checked={detailsConfirmed}
            onChange={(event) => onDetailsConfirmedChange(event.target.checked)}
          />
          <span>
            <FiCheckCircle aria-hidden="true" /> I have verified all details and documents above. The
            information provided is accurate and complete.
          </span>
        </label>
      ) : null}
    </div>
  );
}

export default KycReviewSummary;
