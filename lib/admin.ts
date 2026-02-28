export function getAdminEmails(): string[] {
  const single = (process.env.ADMIN_EMAIL || "").trim();
  const multipleRaw = (process.env.ADMIN_EMAILS || "").trim();

  const multiple = multipleRaw
    .split(/[;,\n\r\t ]+/)
    .map((email) =>
      email
        .replace(/^['"]|['"]$/g, "")
        .trim()
        .toLowerCase(),
    )
    .filter((email) => email.length > 0);

  const normalizedSingle = single
    .replace(/^['"]|['"]$/g, "")
    .trim()
    .toLowerCase();

  const all = [...multiple, normalizedSingle].filter(
    (email) => email.length > 0,
  );

  return Array.from(new Set(all));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}
