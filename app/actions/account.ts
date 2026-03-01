"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";
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

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const secureRaw = String(process.env.SMTP_SECURE || "").trim();

  const secure =
    secureRaw === "1" || secureRaw.toLowerCase() === "true" || port === 465;

  const isValid =
    !!host && Number.isFinite(port) && port > 0 && !!user && !!pass && !!from;

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
    isValid,
  };
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "";

  return {
    apiKey,
    from,
    isValid: !!apiKey && !!from,
  };
}

function getResetEmailContent(resetLink: string) {
  const subject = "Recuperação de senha - ondedoar.io";
  const text = [
    "Você solicitou a recuperação de senha.",
    "",
    "Use o link abaixo para redefinir sua senha:",
    resetLink,
    "",
    "Se você não solicitou essa ação, ignore este e-mail.",
    "O link expira em 1 hora.",
  ].join("\n");
  const html = `
    <p>Você solicitou a recuperação de senha.</p>
    <p>
      Use o link abaixo para redefinir sua senha:<br />
      <a href="${resetLink}">${resetLink}</a>
    </p>
    <p>Se você não solicitou essa ação, ignore este e-mail.</p>
    <p>O link expira em 1 hora.</p>
  `;

  return { subject, text, html };
}

async function sendResetPasswordEmailResend(
  to: string,
  resetLink: string,
): Promise<void> {
  const resendConfig = getResendConfig();

  if (!resendConfig.isValid || !resendConfig.apiKey) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const resend = new Resend(resendConfig.apiKey);
  const { subject, text, html } = getResetEmailContent(resetLink);

  const { error } = await resend.emails.send({
    from: resendConfig.from,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`RESEND_ERROR:${error.message}`);
  }
}

async function sendResetPasswordEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const smtp = getSmtpConfig();

  if (!smtp.isValid) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    ...getResetEmailContent(resetLink),
  });
}

export async function solicitarResetSenha(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/esqueci-senha?error=missing_email");
  }

  const smtp = getSmtpConfig();
  const resendConfig = getResendConfig();
  const hasEmailProvider = resendConfig.isValid || smtp.isValid;

  if (process.env.NODE_ENV === "production" && !hasEmailProvider) {
    console.error("SMTP não configurado em produção.");
    redirect("/esqueci-senha?error=email_unavailable");
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

      const resetLink = `${getBaseUrl()}/redefinir-senha?token=${rawToken}`;

      if (resendConfig.isValid) {
        try {
          await sendResetPasswordEmailResend(email, resetLink);
        } catch (resendError) {
          console.warn(
            "Falha no envio com Resend, tentando SMTP:",
            resendError,
          );

          if (smtp.isValid) {
            await sendResetPasswordEmail(email, resetLink);
          } else if (process.env.NODE_ENV !== "production") {
            console.log("[RESET_PASSWORD_LINK]", resetLink);
          } else {
            redirect("/esqueci-senha?error=email_unavailable");
          }
        }
      } else if (smtp.isValid) {
        try {
          await sendResetPasswordEmail(email, resetLink);
        } catch (mailError) {
          const authErrorCode =
            typeof mailError === "object" &&
            mailError !== null &&
            "code" in mailError
              ? String((mailError as { code?: unknown }).code || "")
              : "";

          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "Falha no envio SMTP, usando link em console:",
              mailError,
            );
            console.log("[RESET_PASSWORD_LINK]", resetLink);
          } else if (authErrorCode === "EAUTH") {
            redirect("/esqueci-senha?error=email_unavailable");
          } else {
            throw mailError;
          }
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.log("[RESET_PASSWORD_LINK]", resetLink);
      }
    }

    redirect("/esqueci-senha?status=sent");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao solicitar reset de senha:", error);

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";

    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : "";

    if (errorCode === "EAUTH") {
      redirect("/esqueci-senha?error=email_unavailable");
    }

    if (
      errorMessage.includes("RESEND_ERROR:") &&
      errorMessage.toLowerCase().includes("domain is not verified")
    ) {
      redirect("/esqueci-senha?error=email_unavailable");
    }

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
