const FIXED_ADMIN_EMAIL = "edudeveloperctk@gmail.com";

export function getAdminEmails(): string[] {
  return [FIXED_ADMIN_EMAIL];
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
