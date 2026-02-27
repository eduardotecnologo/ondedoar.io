"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function registerUser(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/register?error=missing_fields");
  }

  // Verifica se o usuário já existe
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    redirect("/register?error=user_exists");
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
