const FIXED_ADMIN_EMAILS = [
  "edudeveloperctk@gmail.com",
  "eduardotecnologo@hotmail.com",
];

export function getAdminEmails(): string[] {
  return FIXED_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}

export async function isVerifiedAdminEmail(
  email: string | null | undefined,
): Promise<boolean> {
  return isAdminEmail(email);
}
