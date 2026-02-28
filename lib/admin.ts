export function getAdminEmails(): string[] {
  const single = (process.env.ADMIN_EMAIL || "").trim();
  const multipleRaw = (process.env.ADMIN_EMAILS || "").trim();

  const multiple = multipleRaw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

  const all = [...multiple, single.toLowerCase()].filter(
    (email) => email.length > 0,
  );

  return Array.from(new Set(all));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}
