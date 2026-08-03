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
  const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  return specialChars.test(password);
}
export function hasNoWhiteSpace(password) {
  return !/\s/.test(password);
}
export function hasPasswordCapital(password) {
  return /[A-Z]/.test(password);
}
export function hasPasswordSmall(password) {
  return /[a-z]/.test(password);
}
