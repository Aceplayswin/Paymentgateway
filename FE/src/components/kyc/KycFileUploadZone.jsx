import { useState } from "react";
import { FiEye, FiFileText, FiUpload, FiX } from "react-icons/fi";
import {
  fileToStoredValue,
  getFileName,
  getKycFileSizeError,
  isImageFile,
  normalizeFileValue,
} from "../../utils/kycFileHelpers";
import { showServerErrorToast } from "../../utils/toast";
import KycFieldLabel from "./KycFieldLabel";

function KycFileUploadZone({
  id,
  label,
  value,
  onChange,
  required = false,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  placeholder = "Choose file (PDF, JPG, PNG)",
  hint,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileValue = normalizeFileValue(value);
  const fileName = getFileName(value);

  const imageOnly = !accept.toLowerCase().includes("pdf");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      onChange(null);
      return;
    }

    if (imageOnly && !isImageFile(file)) {
      showServerErrorToast("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }

    const sizeError = getKycFileSizeError(file, label);
    if (sizeError) {
      showServerErrorToast(sizeError);
      return;
    }

    const stored = await fileToStoredValue(file);
    onChange(stored);
  };

  return (
    <div className="file-upload-zone">
      <KycFieldLabel htmlFor={id} required={required}>
        {label}
      </KycFieldLabel>
      {hint ? <p className="file-upload-hint">{hint}</p> : null}
      <label htmlFor={id} className={`file-upload-trigger${fileValue ? " file-upload-trigger--filled" : ""}`}>
        <FiUpload aria-hidden="true" />
        <span className="file-upload-trigger__name">
          {fileName || placeholder}
        </span>
        {fileValue ? (
          <span className="file-upload-trigger__actions">
            <button
              type="button"
              className="file-upload-preview-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPreviewOpen(true);
              }}
            >
              <FiEye aria-hidden="true" />
              Preview
            </button>
            <button
              type="button"
              className="file-upload-clear-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(null);
              }}
              aria-label={`Remove ${fileName}`}
            >
              <FiX aria-hidden="true" />
            </button>
          </span>
        ) : null}
        <input
          id={id}
          type="file"
          accept={accept}
          className="file-upload-input"
          onChange={handleFileChange}
        />
      </label>

      {previewOpen && fileValue ? (
        <div className="kyc-file-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${fileName}`}>
          <div className="kyc-file-preview-card">
            <header className="kyc-file-preview-header">
              <h3>{fileName}</h3>
              <button type="button" className="kyc-file-preview-close" onClick={() => setPreviewOpen(false)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="kyc-file-preview-body">
              {isImageFile(fileValue) && fileValue.previewUrl ? (
                <img src={fileValue.previewUrl} alt={fileName} className="kyc-file-preview-image" />
              ) : (
                <div className="kyc-file-preview-fallback">
                  <FiFileText aria-hidden="true" />
                  <p>Preview available for image files in this session.</p>
                  <p>{fileName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default KycFileUploadZone;
