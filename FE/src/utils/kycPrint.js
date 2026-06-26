import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  getFileDataUrl,
  getFileName,
  isImageFile,
  isPdfFile,
  normalizeFileValue,
} from "./kycFileHelpers";
import { getDocumentTypeConfig, getUploadDocumentLabel, KYC_FIELD_LABELS } from "./kycValidation";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDF_MARGIN = 14;
const PDF_LINE_HEIGHT = 6.5;
const PDF_MAX_IMAGE_HEIGHT = 110;
const PDF_MAX_PDF_PAGES_PER_FILE = 8;

function formatValue(value) {
  if (!value) {
    return "—";
  }
  if (typeof value === "object" && value.name) {
    return value.name;
  }
  return String(value);
}

function sectionRows(section, keys) {
  return keys
    .map((key) => {
      const label = KYC_FIELD_LABELS[key] || key;
      return `<tr><th>${label}</th><td>${formatValue(section[key])}</td></tr>`;
    })
    .join("");
}

function buildDocumentImageHtml(label, file) {
  const fileValue = normalizeFileValue(file);
  const dataUrl = getFileDataUrl(fileValue);
  if (!dataUrl) {
    return `<p><strong>${label}:</strong> ${getFileName(file) || "—"}</p>`;
  }

  if (isImageFile(fileValue)) {
    return `
      <div class="doc-block">
        <h3>${label}</h3>
        <p class="doc-name">${fileValue.name}</p>
        <img src="${dataUrl}" alt="${fileValue.name}" />
      </div>
    `;
  }

  if (isPdfFile(fileValue)) {
    return `
      <div class="doc-block">
        <h3>${label}</h3>
        <p class="doc-name">${fileValue.name}</p>
        <p class="doc-note">PDF document attached (${Math.round((fileValue.size || 0) / 1024)} KB). Open the downloaded PDF export for rendered pages.</p>
      </div>
    `;
  }

  return `<p><strong>${label}:</strong> ${fileValue.name}</p>`;
}

export function buildKycSummaryHtml(formData, email) {
  const savedAt = new Date().toLocaleString();
  const docConfig = getDocumentTypeConfig(formData.identityDocs.idType);
  const documentBlocks = collectDocumentItems(formData)
    .map((item) => buildDocumentImageHtml(item.label, item.file))
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Paygate KYC Summary</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
    h1 { font-size: 1.4rem; margin-bottom: 4px; }
    h2 { font-size: 1rem; margin: 20px 0 8px; color: #1d4ed8; }
    h3 { font-size: 0.92rem; margin: 0 0 6px; color: #1e3a8a; }
    p { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; font-size: 0.9rem; }
    th { width: 34%; background: #f8fafc; }
    .meta { margin-bottom: 18px; color: #64748b; font-size: 0.85rem; }
    .doc-block { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
    .doc-name { color: #64748b; font-size: 0.85rem; }
    .doc-block img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; }
    .doc-note { color: #64748b; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Merchant KYC Summary</h1>
  <p class="meta">Merchant: ${email || "—"} · Generated: ${savedAt}</p>
  <h2>Personal Information</h2>
  <table>${sectionRows(formData.personal, ["fullName", "dateOfBirth", "gender", "nationality", "address", "city", "state", "pinCode"])}</table>
  <table><tr><th>${KYC_FIELD_LABELS.idType}</th><td>${docConfig.label}</td></tr>${sectionRows(formData.identityDocs, ["idNumber"])}</table>
  <h2>Business Information</h2>
  <table>${sectionRows(formData.business, ["legalName", "businessType", "gstin", "pan", "registeredAddress", "website"])}</table>
  <h2>Documents Upload</h2>
  <table>${collectDocumentItems(formData)
    .map((item) => `<tr><th>${item.label}</th><td>${getFileName(item.file) || "—"}</td></tr>`)
    .join("")}</table>
  <h2>Bank Account</h2>
  <table>${sectionRows(formData.bank, ["accountHolder", "bankName", "ifsc", "accountNumber", "accountType", "passbookFrontFile"])}</table>
  <h2>Uploaded Document Previews</h2>
  ${documentBlocks || "<p>No uploaded documents found.</p>"}
</body>
</html>`;
}

export function downloadKycSummary(formData, email) {
  const html = buildKycSummaryHtml(formData, email);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `paygate-kyc-summary-${Date.now()}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printKycSummary(formData, email) {
  const html = buildKycSummaryHtml(formData, email);
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) {
    return false;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function ensurePdfSpace(doc, y, requiredHeight = PDF_LINE_HEIGHT) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + requiredHeight > pageHeight - PDF_MARGIN) {
    doc.addPage();
    return PDF_MARGIN;
  }
  return y;
}

function addPdfLines(doc, text, x, y, maxWidth, fontSize = 10, fontStyle = "normal") {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", fontStyle);
  const lines = doc.splitTextToSize(String(text ?? "—"), maxWidth);

  lines.forEach((line) => {
    y = ensurePdfSpace(doc, y);
    doc.text(line, x, y);
    y += PDF_LINE_HEIGHT;
  });

  return y;
}

function getJsPdfImageFormat(dataUrl) {
  const match = String(dataUrl).match(/^data:image\/(\w+);/i);
  if (!match) {
    return "JPEG";
  }

  const type = match[1].toLowerCase();
  if (type === "png") {
    return "PNG";
  }
  if (type === "webp") {
    return "WEBP";
  }
  return "JPEG";
}

function loadImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 800, height: 600 });
    image.src = dataUrl;
  });
}

function getScaledImageSizeMm(naturalWidth, naturalHeight, maxWidthMm, maxHeightMm) {
  if (!naturalWidth || !naturalHeight) {
    return { width: maxWidthMm, height: maxHeightMm * 0.75 };
  }

  const aspect = naturalHeight / naturalWidth;
  let width = maxWidthMm;
  let height = width * aspect;

  if (height > maxHeightMm) {
    height = maxHeightMm;
    width = height / aspect;
  }

  return { width, height };
}

async function renderPdfPagesAsDataUrls(pdfDataUrl, maxPages = PDF_MAX_PDF_PAGES_PER_FILE) {
  const base64 = pdfDataUrl.split(",")[1];
  if (!base64) {
    return [];
  }

  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const results = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    results.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  return results;
}

async function addPdfImage(doc, dataUrl, x, y, maxWidthMm, maxHeightMm) {
  const dimensions = await loadImageDimensions(dataUrl);
  const scaled = getScaledImageSizeMm(
    dimensions.width,
    dimensions.height,
    maxWidthMm,
    maxHeightMm,
  );
  const format = getJsPdfImageFormat(dataUrl);

  y = ensurePdfSpace(doc, y, scaled.height + 4);
  doc.addImage(dataUrl, format, x, y, scaled.width, scaled.height);
  return y + scaled.height + 4;
}

function collectDocumentItems(formData) {
  const docConfig = getDocumentTypeConfig(formData.identityDocs.idType);
  const items = [
    { label: docConfig.frontLabel, file: formData.identityDocs.idFrontFile },
    ...(docConfig.showBack
      ? [{ label: docConfig.backLabel, file: formData.identityDocs.idBackFile }]
      : []),
    ...(formData.flexibleDocuments || []).map((entry) => ({
      label: getUploadDocumentLabel(entry.documentType),
      file: entry.file,
    })),
    { label: KYC_FIELD_LABELS.passbookFrontFile, file: formData.bank.passbookFrontFile },
  ];

  return items.filter((item) => getFileName(item.file));
}

function getItemDisplayValue(item) {
  if (item.value) {
    return item.value;
  }
  if (item.file) {
    return getFileName(item.file) || "—";
  }
  return "—";
}

export async function downloadKycSummaryPdf(formData, email) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  let y = PDF_MARGIN;

  y = addPdfLines(doc, "Merchant KYC Summary", PDF_MARGIN, y, contentWidth, 16, "bold");
  y = addPdfLines(doc, `Merchant: ${email || "—"}`, PDF_MARGIN, y, contentWidth, 10);
  y = addPdfLines(doc, `Generated: ${new Date().toLocaleString()}`, PDF_MARGIN, y, contentWidth, 10);
  y += 4;

  getReviewSections(formData).forEach((section) => {
    y = ensurePdfSpace(doc, y, PDF_LINE_HEIGHT * 2);
    y = addPdfLines(doc, section.title, PDF_MARGIN, y, contentWidth, 12, "bold");

    section.items.forEach((item) => {
      y = addPdfLines(
        doc,
        `${item.label}: ${getItemDisplayValue(item)}`,
        PDF_MARGIN,
        y,
        contentWidth,
        10,
      );
    });

    y += 3;
  });

  y = ensurePdfSpace(doc, y, PDF_LINE_HEIGHT * 2);
  y = addPdfLines(doc, "Uploaded Document Previews", PDF_MARGIN, y, contentWidth, 12, "bold");
  y += 2;

  const documentItems = collectDocumentItems(formData);

  if (!documentItems.length) {
    y = addPdfLines(doc, "No uploaded documents found.", PDF_MARGIN, y, contentWidth, 10);
  }

  for (const item of documentItems) {
    const fileValue = normalizeFileValue(item.file);
    const dataUrl = getFileDataUrl(fileValue);

    y = ensurePdfSpace(doc, y, PDF_LINE_HEIGHT * 2);
    y = addPdfLines(doc, item.label, PDF_MARGIN, y, contentWidth, 11, "bold");
    y = addPdfLines(doc, `File: ${getFileName(item.file)}`, PDF_MARGIN, y, contentWidth, 10);

    if (!dataUrl) {
      y = addPdfLines(
        doc,
        "Document preview unavailable in this export.",
        PDF_MARGIN,
        y,
        contentWidth,
        9,
      );
      y += 2;
      continue;
    }

    if (isImageFile(fileValue)) {
      try {
        y = await addPdfImage(doc, dataUrl, PDF_MARGIN, y, contentWidth, PDF_MAX_IMAGE_HEIGHT);
      } catch {
        y = addPdfLines(doc, "Image preview unavailable in PDF.", PDF_MARGIN, y, contentWidth, 9);
      }
      y += 2;
      continue;
    }

    if (isPdfFile(fileValue)) {
      try {
        const pages = await renderPdfPagesAsDataUrls(dataUrl);
        if (!pages.length) {
          y = addPdfLines(doc, "PDF preview unavailable in PDF.", PDF_MARGIN, y, contentWidth, 9);
          y += 2;
          continue;
        }

        for (let index = 0; index < pages.length; index += 1) {
          y = addPdfLines(
            doc,
            `Page ${index + 1} of ${pages.length}`,
            PDF_MARGIN,
            y,
            contentWidth,
            9,
          );
          y = await addPdfImage(
            doc,
            pages[index],
            PDF_MARGIN,
            y,
            contentWidth,
            PDF_MAX_IMAGE_HEIGHT,
          );
        }
      } catch {
        y = addPdfLines(doc, "PDF preview unavailable in PDF.", PDF_MARGIN, y, contentWidth, 9);
      }
      y += 2;
      continue;
    }

    y = addPdfLines(doc, "Preview not supported for this file type.", PDF_MARGIN, y, contentWidth, 9);
    y += 2;
  }

  const fileSlug = String(email || "merchant")
    .split("@")[0]
    .replace(/[^a-z0-9_-]+/gi, "-")
    .toLowerCase();

  doc.save(`paygate-kyc-${fileSlug}-${Date.now()}.pdf`);
}

export function getReviewSections(formData) {
  const docConfig = getDocumentTypeConfig(formData.identityDocs.idType);
  const documentUploadItems = [
    {
      label: docConfig.frontLabel,
      value: getFileName(formData.identityDocs.idFrontFile),
      file: formData.identityDocs.idFrontFile,
    },
  ];

  if (docConfig.showBack) {
    documentUploadItems.push({
      label: docConfig.backLabel,
      value: getFileName(formData.identityDocs.idBackFile) || "—",
      file: formData.identityDocs.idBackFile,
    });
  }

  documentUploadItems.push(
    ...(formData.flexibleDocuments || []).map((entry) => ({
      label: getUploadDocumentLabel(entry.documentType),
      value: getFileName(entry.file) || "—",
      file: entry.file,
    })),
  );

  return [
    {
      title: "Personal Information",
      items: [
        { label: KYC_FIELD_LABELS.fullName, value: formData.personal.fullName },
        { label: KYC_FIELD_LABELS.dateOfBirth, value: formData.personal.dateOfBirth },
        { label: KYC_FIELD_LABELS.gender, value: formData.personal.gender },
        { label: KYC_FIELD_LABELS.nationality, value: formData.personal.nationality },
        { label: KYC_FIELD_LABELS.address, value: formData.personal.address },
        { label: KYC_FIELD_LABELS.city, value: formData.personal.city },
        { label: KYC_FIELD_LABELS.state, value: formData.personal.state },
        { label: KYC_FIELD_LABELS.pinCode, value: formData.personal.pinCode },
        { label: KYC_FIELD_LABELS.idType, value: docConfig.label },
        { label: KYC_FIELD_LABELS.idNumber, value: formData.identityDocs.idNumber },
      ],
    },
    {
      title: "Business Information",
      items: [
        { label: KYC_FIELD_LABELS.legalName, value: formData.business.legalName },
        { label: KYC_FIELD_LABELS.businessType, value: formData.business.businessType },
        { label: KYC_FIELD_LABELS.gstin, value: formData.business.gstin },
        { label: KYC_FIELD_LABELS.pan, value: formData.business.pan || "—" },
        { label: KYC_FIELD_LABELS.registeredAddress, value: formData.business.registeredAddress },
        { label: KYC_FIELD_LABELS.website, value: formData.business.website || "—" },
      ],
    },
    {
      title: "Documents Upload",
      items: documentUploadItems,
    },
    {
      title: "Bank Account",
      items: [
        { label: KYC_FIELD_LABELS.accountHolder, value: formData.bank.accountHolder },
        { label: KYC_FIELD_LABELS.bankName, value: formData.bank.bankName },
        { label: KYC_FIELD_LABELS.ifsc, value: formData.bank.ifsc },
        { label: KYC_FIELD_LABELS.accountNumber, value: formData.bank.accountNumber },
        { label: KYC_FIELD_LABELS.accountType, value: formData.bank.accountType },
        {
          label: KYC_FIELD_LABELS.passbookFrontFile,
          value: getFileName(formData.bank.passbookFrontFile),
          file: formData.bank.passbookFrontFile,
        },
      ],
    },
  ];
}
