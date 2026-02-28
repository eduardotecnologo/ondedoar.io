"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function registerUser(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/register?error=missing_fields");
  }

  // Verifica se o usuário já existe
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    if (userExists.password) {
      redirect("/register?error=user_exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userExists.id },
      data: {
        nome: name || userExists.nome,
        password: hashedPassword,
      },
    });

    redirect("/login?success=password_created");
  }

  // Criptografa a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        nome: name,
        email,
        password: hashedPassword,
      },
    });

    redirect("/login?success=registered");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/register?error=unknown");
  }
}
