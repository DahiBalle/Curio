// Input validation pure helpers
export function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
