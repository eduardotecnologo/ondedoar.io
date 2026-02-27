"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
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
