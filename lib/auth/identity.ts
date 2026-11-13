// Students log in with a phone number and staff with a username. Supabase Auth
// needs an email, so both map to synthetic addresses on separate domains.

export const STUDENT_EMAIL_DOMAIN = "students.tuition.local";
export const STAFF_EMAIL_DOMAIN = "tuition.local";

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

/** Returns a 10-digit Indian mobile number, or null if the input isn't one. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function studentEmail(phone: string): string {
  return `${phone}@${STUDENT_EMAIL_DOMAIN}`;
}

export function normalizeUsername(input: string): string | null {
  const name = input.trim().toLowerCase();
  return USERNAME_RE.test(name) ? name : null;
}

export function staffEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}

/** Maps what the user typed on the login form to their auth email. */
export function loginEmail(identifier: string): string | null {
  if (/^[\d\s+-]+$/.test(identifier.trim())) {
    const phone = normalizePhone(identifier);
    return phone ? studentEmail(phone) : null;
  }
  const username = normalizeUsername(identifier);
  return username ? staffEmail(username) : null;
}
