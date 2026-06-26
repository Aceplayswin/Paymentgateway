const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_FILE_BYTES = 2_000_000;
const UPLOAD_ROOT = path.resolve(
  process.env.KYC_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'kyc')
);

const MIME_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf'
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const sanitizeFileName = (name) =>
  String(name || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);

const getExtension = (fileValue) => {
  const mime = String(fileValue?.type || '').toLowerCase();
  if (MIME_EXTENSION[mime]) return MIME_EXTENSION[mime];

  const fromName = path.extname(String(fileValue?.name || '')).toLowerCase();
  if (fromName) return fromName;

  return '.bin';
};

const decodeDataUrl = (dataUrl) => {
  const raw = String(dataUrl || '').trim();
  if (!raw) return null;

  const match = raw.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;

  const buffer = Buffer.from(match[2], 'base64');
  return { mimeType: match[1], buffer };
};

const persistStoredFile = async (userId, fieldKey, fileValue) => {
  if (!fileValue) return null;

  if (fileValue.storagePath) {
    return {
      name: fileValue.name || path.basename(fileValue.storagePath),
      type: fileValue.type || '',
      size: fileValue.size || 0,
      storagePath: fileValue.storagePath
    };
  }

  const dataUrl = fileValue.dataUrl || fileValue.previewUrl || null;
  if (!dataUrl) {
    if (fileValue.name) {
      return {
        name: fileValue.name,
        type: fileValue.type || '',
        size: fileValue.size || 0,
        storagePath: null
      };
    }
    return null;
  }

  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) {
    throw new Error(`Invalid file data for ${fieldKey}`);
  }

  if (decoded.buffer.length > MAX_FILE_BYTES) {
    throw new Error(`File ${fieldKey} exceeds maximum allowed size of 2 MB`);
  }

  const userDir = path.join(UPLOAD_ROOT, String(userId));
  ensureDir(userDir);

  const extension = getExtension({ ...fileValue, type: decoded.mimeType || fileValue.type });
  const safeField = String(fieldKey).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${safeField}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension}`;
  const absolutePath = path.join(userDir, uniqueName);
  const storagePath = path.posix.join(String(userId), uniqueName);

  await fs.promises.writeFile(absolutePath, decoded.buffer);

  return {
    name: fileValue.name || uniqueName,
    type: decoded.mimeType || fileValue.type || '',
    size: decoded.buffer.length,
    storagePath
  };
};

const persistKycFiles = async (userId, formData = {}) => {
  const next = structuredClone(formData);

  if (next.identityDocs) {
    next.identityDocs.idFrontFile = await persistStoredFile(
      userId,
      'id_front',
      next.identityDocs.idFrontFile
    );
    if (next.identityDocs.idBackFile) {
      next.identityDocs.idBackFile = await persistStoredFile(
        userId,
        'id_back',
        next.identityDocs.idBackFile
      );
    }
  }

  if (next.bank?.passbookFrontFile) {
    next.bank.passbookFrontFile = await persistStoredFile(
      userId,
      'passbook_front',
      next.bank.passbookFrontFile
    );
  }

  if (Array.isArray(next.flexibleDocuments)) {
    next.flexibleDocuments = await Promise.all(
      next.flexibleDocuments.map(async (entry, index) => ({
        ...entry,
        file: entry.file
          ? await persistStoredFile(userId, `doc_${entry.documentType || index}`, entry.file)
          : entry.file
      }))
    );
  }

  return next;
};

const resolveStoredFilePath = (storagePath) => {
  const normalized = String(storagePath || '').replace(/\\/g, '/');
  if (!normalized || normalized.includes('..')) {
    return null;
  }

  const absolutePath = path.resolve(UPLOAD_ROOT, normalized);
  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    return null;
  }

  return absolutePath;
};

const readStoredFile = async (storagePath) => {
  const absolutePath = resolveStoredFilePath(storagePath);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(absolutePath);
  return { absolutePath, buffer };
};

module.exports = {
  UPLOAD_ROOT,
  persistKycFiles,
  resolveStoredFilePath,
  readStoredFile
};
