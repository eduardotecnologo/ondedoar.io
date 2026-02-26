"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios." };
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
        name,
        email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    return { error: "Erro ao criar conta." };
  }

  redirect("/login?success=registered");
}
