import { FiTrash2 } from "react-icons/fi";
import {
  getUploadAccept,
  getUploadDocumentLabel,
  getUploadHint,
  getUploadPlaceholder,
} from "../../utils/kycValidation";
import KycDocumentTypeSelect from "./KycDocumentTypeSelect";
import KycFileUploadZone from "./KycFileUploadZone";

function KycTypedDocumentRow({
  id,
  documentType,
  file,
  onDocumentTypeChange,
  onFileChange,
  onRemove,
  canRemove = false,
  required = false,
}) {
  const uploadLabel = getUploadDocumentLabel(documentType);

  return (
    <div className="kyc-typed-document-row">
      <div className="kyc-typed-document-row__type">
        <KycDocumentTypeSelect
          id={`${id}-type`}
          value={documentType}
          onChange={onDocumentTypeChange}
          variant="upload"
          required={required}
        />
      </div>
      <div className="kyc-typed-document-row__upload">
        <KycFileUploadZone
          id={`${id}-file`}
          label={uploadLabel}
          required={required}
          accept={getUploadAccept(documentType)}
          placeholder={getUploadPlaceholder(documentType)}
          hint={getUploadHint(documentType)}
          value={file}
          onChange={onFileChange}
        />
      </div>
      {canRemove ? (
        <button
          type="button"
          className="kyc-typed-document-row__remove"
          onClick={onRemove}
          aria-label={`Remove ${uploadLabel}`}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default KycTypedDocumentRow;
