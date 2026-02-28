"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function alterarSenha(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?error=auth_required");
  }

  const senhaAtual = String(formData.get("senhaAtual") || "");
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarNovaSenha = String(formData.get("confirmarNovaSenha") || "");

  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    redirect("/dashboard?pwd_error=missing_fields");
  }

  if (novaSenha.length < 8) {
    redirect("/dashboard?pwd_error=weak_password");
  }

  if (novaSenha !== confirmarNovaSenha) {
    redirect("/dashboard?pwd_error=password_mismatch");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      redirect("/dashboard?pwd_error=user_not_found");
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, user.password);

    if (!senhaCorreta) {
      redirect("/dashboard?pwd_error=wrong_current_password");
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: novaSenhaHash },
    });

    redirect("/dashboard?pwd_success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao alterar senha:", error);
    redirect("/dashboard?pwd_error=unknown");
  }
}

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"
  );
}

function buildTokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function solicitarResetSenha(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/esqueci-senha?error=missing_email");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user?.id) {
      await prisma.passwordResetToken.deleteMany({
        where: { user_id: user.id },
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = buildTokenHash(rawToken);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      await prisma.passwordResetToken.create({
        data: {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      });

      if (process.env.NODE_ENV !== "production") {
        const resetLink = `${getBaseUrl()}/redefinir-senha?token=${rawToken}`;
        console.log("[RESET_PASSWORD_LINK]", resetLink);
      }
    }

    redirect("/esqueci-senha?status=sent");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao solicitar reset de senha:", error);
    redirect("/esqueci-senha?error=unknown");
  }
}

export async function redefinirSenhaComToken(
  formData: FormData,
): Promise<void> {
  const token = String(formData.get("token") || "").trim();
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarNovaSenha = String(formData.get("confirmarNovaSenha") || "");

  if (!token || !novaSenha || !confirmarNovaSenha) {
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&error=missing_fields`,
    );
  }

  if (novaSenha.length < 8) {
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&error=weak_password`,
    );
  }

  if (novaSenha !== confirmarNovaSenha) {
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&error=password_mismatch`,
    );
  }

  try {
    const tokenHash = buildTokenHash(token);

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      redirect("/redefinir-senha?error=invalid_or_expired");
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.user_id },
        data: { password: novaSenhaHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          user_id: resetToken.user_id,
          id: { not: resetToken.id },
        },
      });
    });

    redirect("/login?reset=success");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao redefinir senha:", error);
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&error=unknown`,
    );
  }
}
