import Swal from "sweetalert2";
import { getStoredTheme } from "./theme";
import "../styles/sweetalert.css";

function getThemeClass() {
  return getStoredTheme() === "dark" ? "swal-theme-dark" : "swal-theme-light";
}

function baseConfig() {
  return {
    buttonsStyling: false,
    reverseButtons: true,
    focusCancel: true,
    heightAuto: false,
    customClass: {
      container: "swal-container",
      popup: `swal-popup ${getThemeClass()}`,
      title: "swal-title",
      htmlContainer: "swal-html",
      actions: "swal-actions",
      cancelButton: "swal-btn swal-btn-cancel",
      input: "swal-textarea",
      validationMessage: "swal-validation",
    },
  };
}

function merchantNameHtml(merchantName) {
  return `<span class="swal-merchant-name">${merchantName}</span>`;
}

export async function confirmApproveMerchant(merchantName) {
  const result = await Swal.fire({
    ...baseConfig(),
    title: "Approve Merchant Request",
    html: `
      <p class="swal-message">
        Are you sure you want to approve ${merchantNameHtml(merchantName)}?
      </p>
      <p class="swal-submessage">
        They will be able to sign in and access the merchant dashboard.
      </p>
    `,
    icon: "question",
    iconColor: "#22c55e",
    showCancelButton: true,
    confirmButtonText: "Confirm Approval",
    cancelButtonText: "Cancel",
    customClass: {
      ...baseConfig().customClass,
      confirmButton: "swal-btn swal-btn-approve",
    },
  });

  return result.isConfirmed;
}

export async function confirmRejectMerchant(merchantName) {
  const result = await Swal.fire({
    ...baseConfig(),
    title: "Reject Merchant Request",
    html: `
      <p class="swal-message">
        Are you sure you want to reject ${merchantNameHtml(merchantName)}?
      </p>
      <p class="swal-submessage">
        The merchant will not be able to sign in until they reapply.
      </p>
    `,
    icon: "warning",
    iconColor: "#f59e0b",
    input: "textarea",
    inputPlaceholder: "Provide a reason for rejection (optional)...",
    inputAttributes: {
      maxlength: 500,
      "aria-label": "Rejection reason",
      rows: 3,
    },
    showCancelButton: true,
    confirmButtonText: "Confirm Rejection",
    cancelButtonText: "Cancel",
    customClass: {
      ...baseConfig().customClass,
      confirmButton: "swal-btn swal-btn-reject",
    },
  });

  if (!result.isConfirmed) {
    return { confirmed: false, reason: "" };
  }

  return { confirmed: true, reason: String(result.value || "").trim() };
}

export async function confirmMerchantApproval({
  title,
  message,
  submessage,
  confirmText = "Confirm Approval",
}) {
  const result = await Swal.fire({
    ...baseConfig(),
    title,
    html: `
      <p class="swal-message">${message}</p>
      ${submessage ? `<p class="swal-submessage">${submessage}</p>` : ""}
    `,
    icon: "question",
    iconColor: "#22c55e",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    customClass: {
      ...baseConfig().customClass,
      confirmButton: "swal-btn swal-btn-approve",
    },
  });

  return result.isConfirmed;
}

export function showActionLoading(title = "Processing...") {
  return Swal.fire({
    ...baseConfig(),
    title,
    html: '<p class="swal-submessage">Please wait while we complete this action.</p>',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function showActionSuccess(title, message) {
  return Swal.fire({
    ...baseConfig(),
    title,
    html: `<p class="swal-success-message">${message}</p>`,
    icon: "success",
    iconColor: "#22c55e",
    confirmButtonText: "Done",
    customClass: {
      ...baseConfig().customClass,
      popup: `swal-popup swal-popup--success ${getThemeClass()}`,
      title: "swal-title swal-title--centered",
      htmlContainer: "swal-html swal-html--centered",
      confirmButton: "swal-btn swal-btn-approve",
    },
  });
}

export async function confirmApproveKyc(merchantName) {
  return confirmMerchantApproval({
    title: "Approve KYC",
    message: `Are you sure you want to approve KYC for ${merchantNameHtml(merchantName)}?`,
    submessage: "The merchant will be marked as fully verified.",
    confirmText: "Approve KYC",
  });
}

export async function confirmRejectKyc(merchantName) {
  const result = await Swal.fire({
    ...baseConfig(),
    title: "Reject KYC",
    html: `
      <p class="swal-message">
        Are you sure you want to reject KYC for ${merchantNameHtml(merchantName)}?
      </p>
      <p class="swal-submessage">
        The merchant will be asked to review and resubmit their documents.
      </p>
    `,
    icon: "warning",
    iconColor: "#f59e0b",
    input: "textarea",
    inputPlaceholder: "Provide a reason for rejection (optional)...",
    inputAttributes: {
      maxlength: 500,
      "aria-label": "Rejection reason",
      rows: 3,
    },
    showCancelButton: true,
    confirmButtonText: "Reject KYC",
    cancelButtonText: "Cancel",
    customClass: {
      ...baseConfig().customClass,
      confirmButton: "swal-btn swal-btn-reject",
    },
  });

  if (!result.isConfirmed) {
    return { confirmed: false, reason: "" };
  }

  return { confirmed: true, reason: String(result.value || "").trim() };
}

export function closeSweetAlert() {
  Swal.close();
}
