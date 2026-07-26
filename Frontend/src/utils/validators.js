// Input validation pure helpers
export function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(username);
}
export function hasPasswordNumber(password) {
  return /[0-9]/.test(password);
}
export function hasPasswordSymbol(password) {
  return /[^A-Za-z0-9]/.test(password);
}
export function hasPasswordWhiteSpace(password) {
  return /[\s]/.test(password);
}
export function hasPasswordCapital(password) {
  return /[A-Z]/.test(password);
}
export function hasPasswordSmall(password) {
  return /[a-z]/.test(password);
}

