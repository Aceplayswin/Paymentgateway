import { useState } from "react";
import { FiDownload, FiEye, FiFileText, FiX } from "react-icons/fi";
import {
  getFileDataUrl,
  getFileName,
  isImageFile,
  isPdfFile,
  normalizeFileValue,
} from "../../utils/kycFileHelpers";

function KycDocumentPreviewCard({ label, file }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileValue = normalizeFileValue(file);

  if (!fileValue) {
    return null;
  }

  const dataUrl = getFileDataUrl(fileValue);
  const canPreview = Boolean(dataUrl && (isImageFile(fileValue) || isPdfFile(fileValue)));

  const handleDownload = () => {
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileValue.name || "document";
    link.click();
  };

  return (
    <>
      <div className="kyc-review-doc">
        <p className="kyc-review-doc__label">{label}</p>
        <p className="kyc-review-doc__name">{fileValue.name}</p>

        {isImageFile(fileValue) && dataUrl ? (
          <img src={dataUrl} alt={fileValue.name} className="kyc-review-doc__image" />
        ) : isPdfFile(fileValue) && dataUrl ? (
          <div className="kyc-review-doc__pdf-badge">
            <FiFileText aria-hidden="true" />
            <span>PDF document</span>
          </div>
        ) : (
          <div className="kyc-review-doc__fallback">
            <FiFileText aria-hidden="true" />
            <span>{dataUrl ? "Document attached" : "File name saved — preview unavailable"}</span>
          </div>
        )}

        <div className="kyc-review-doc__actions">
          {canPreview ? (
            <button
              type="button"
              className="kyc-review-doc__action-btn"
              onClick={() => setPreviewOpen(true)}
            >
              <FiEye aria-hidden="true" />
              View
            </button>
          ) : null}
          {dataUrl ? (
            <button type="button" className="kyc-review-doc__action-btn" onClick={handleDownload}>
              <FiDownload aria-hidden="true" />
              Download
            </button>
          ) : null}
        </div>
      </div>

      {previewOpen && dataUrl ? (
        <div
          className="kyc-file-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${fileValue.name}`}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="kyc-file-preview-card"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="kyc-file-preview-header">
              <h3>{fileValue.name}</h3>
              <button
                type="button"
                className="kyc-file-preview-close"
                onClick={() => setPreviewOpen(false)}
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="kyc-file-preview-body">
              {isImageFile(fileValue) ? (
                <img src={dataUrl} alt={fileValue.name} className="kyc-file-preview-image" />
              ) : isPdfFile(fileValue) ? (
                <iframe
                  src={dataUrl}
                  title={fileValue.name}
                  className="kyc-file-preview-pdf"
                />
              ) : (
                <div className="kyc-file-preview-fallback">
                  <FiFileText aria-hidden="true" />
                  <p>Preview is not available for this file type.</p>
                  <p>{getFileName(fileValue)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default KycDocumentPreviewCard;
