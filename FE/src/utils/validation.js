export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const EMAIL_ERROR = "Please enter a valid email address.";
export const PASSWORD_ERROR =
  "Password must be at least 8 characters and include both letters and numbers.";

export function validateEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password) {
  return PASSWORD_REGEX.test(password);
}
