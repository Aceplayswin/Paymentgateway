export const KYC_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const KYC_MAX_UPLOAD_LABEL = "5 MB";

export function normalizeFileValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim()
      ? { name: value.trim(), type: "", previewUrl: null, dataUrl: null, size: 0 }
      : null;
  }

  if (value.name) {
    const dataUrl = value.dataUrl || null;
    const previewUrl =
      value.previewUrl || (value.type?.startsWith("image/") ? dataUrl : null) || null;

    return {
      name: value.name,
      type: value.type || "",
      previewUrl,
      dataUrl: dataUrl || previewUrl || null,
      size: value.size || 0,
    };
  }

  return null;
}

export function getFileName(value) {
  return normalizeFileValue(value)?.name || "";
}

export function isImageFile(value) {
  const file = normalizeFileValue(value);
  if (!file) {
    return false;
  }
  return file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
}

export function isPdfFile(value) {
  const file = normalizeFileValue(value);
  if (!file) {
    return false;
  }
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function getFileDataUrl(value) {
  return normalizeFileValue(value)?.dataUrl || null;
}

export function getFileSizeBytes(value) {
  if (value && typeof value.size === "number") {
    return value.size;
  }
  return normalizeFileValue(value)?.size || 0;
}

export function isFileWithinSizeLimit(value, maxBytes = KYC_MAX_UPLOAD_BYTES) {
  const size = getFileSizeBytes(value);
  if (size <= 0) {
    return true;
  }
  return size <= maxBytes;
}

export function getKycFileSizeError(value, label = "File") {
  if (!value) {
    return "";
  }

  const size = getFileSizeBytes(value);
  if (size > KYC_MAX_UPLOAD_BYTES) {
    return `${label} must be under ${KYC_MAX_UPLOAD_LABEL}.`;
  }

  return "";
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToStoredValue(file) {
  const stored = {
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl: null,
    dataUrl: null,
  };

  if (file.size <= KYC_MAX_UPLOAD_BYTES) {
    const dataUrl = await readAsDataUrl(file);
    stored.dataUrl = dataUrl;
    if (file.type.startsWith("image/")) {
      stored.previewUrl = dataUrl;
    }
  }

  return stored;
}

function persistStoredFile(file) {
  if (!file || typeof file !== "object" || !file.name) {
    return file;
  }

  const dataUrl = file.dataUrl || file.previewUrl || null;
  const previewUrl = file.previewUrl || (file.type?.startsWith("image/") ? dataUrl : null) || null;

  return {
    ...file,
    dataUrl,
    previewUrl,
  };
}

function persistStoredFilesInSection(section = {}) {
  const nextSection = { ...section };

  Object.keys(nextSection).forEach((key) => {
    const value = nextSection[key];
    if (value && typeof value === "object" && value.name) {
      nextSection[key] = persistStoredFile(value);
    }
  });

  return nextSection;
}

export function prepareKycDataForSubmit(formData) {
  const clone = structuredClone(formData);

  clone.identityDocs = persistStoredFilesInSection(clone.identityDocs);
  clone.bank = persistStoredFilesInSection(clone.bank);

  if (Array.isArray(clone.flexibleDocuments)) {
    clone.flexibleDocuments = clone.flexibleDocuments.map((entry) => ({
      ...entry,
      file: entry.file ? persistStoredFile(entry.file) : entry.file,
    }));
  }

  return clone;
}

export function stripPreviewFromDraft(formData) {
  const clone = structuredClone(formData);

  const stripSection = (section) => {
    Object.keys(section).forEach((key) => {
      const value = section[key];
      if (value && typeof value === "object" && (value.previewUrl || value.dataUrl)) {
        section[key] = { ...value, previewUrl: null, dataUrl: null };
      }
    });
  };

  stripSection(clone.identityDocs);
  if (Array.isArray(clone.flexibleDocuments)) {
    clone.flexibleDocuments = clone.flexibleDocuments.map((entry) => {
      if (entry.file && typeof entry.file === "object" && (entry.file.previewUrl || entry.file.dataUrl)) {
        return { ...entry, file: { ...entry.file, previewUrl: null, dataUrl: null } };
      }
      return entry;
    });
  }
  stripSection(clone.bank);
  return clone;
}
