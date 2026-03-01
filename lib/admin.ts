import prisma from "@/lib/prisma";

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

export async function isVerifiedAdminEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!isAdminEmail(email)) return false;

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const rows = await prisma.$queryRaw<
      Array<{ email_verificado_em: Date | null }>
    >`
      SELECT email_verificado_em
      FROM users
      WHERE LOWER(email) = ${normalizedEmail}
      LIMIT 1
    `;

    return Boolean(rows[0]?.email_verificado_em);
  } catch (error) {
    console.warn("Validação de admin verificado indisponível:", error);
    return false;
  }
}
