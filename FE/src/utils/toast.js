import toast from "react-hot-toast";

function normalizeErrorMessage(error) {
  const message =
    typeof error === "string"
      ? error
      : error?.data?.message || error?.message;

  if (!message) {
    return "";
  }

  if (
    error?.isNetworkError ||
    message.includes("ECONNRESET") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  ) {
    return "Unable to reach the server. Make sure the API is running and try again.";
  }

  return message;
}

export function showServerErrorToast(error) {
  const message = normalizeErrorMessage(error);
  if (!message) {
    return;
  }
  toast.error(message, { id: message });
}

export function showServerSuccessToast(message) {
  if (!message) {
    return;
  }
  toast.success(message);
}
