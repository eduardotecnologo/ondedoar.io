"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function cadastrarPonto(formData: FormData): Promise<void> {
  // Verifica sessão
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    redirect("/login?error=auth_required");
  }

  // Extrai campos do form
  const nome = (formData.get("nome") as string) || "";
  const descricao = (formData.get("descricao") as string) || "";
  const endereco = (formData.get("endereco") as string) || "";
  const numero = (formData.get("numero") as string) || "";

  if (!numero) {
    redirect("/cadastrar?error=1");
  }

  const cidade = (formData.get("cidade") as string) || "";
  const estado = (formData.get("estado") as string) || "";
  const telefone = (formData.get("telefone") as string) || "";
  const whatsapp = (formData.get("whatsapp") as string) || "";
  const categoriasRaw = formData.getAll("categorias"); // pode ser um array de ids ou vazio

  // Normaliza categorias para string[]
  const categoriasIds: string[] = categoriasRaw
    .map((v) => (typeof v === "string" ? v : String(v)))
    .filter((v) => v && v.length > 0);

  // Geocoding via Nominatim
  let latitude = 0;
  let longitude = 0;

  try {
    if (endereco || cidade || estado) {
      const queryEndereco = numero ? `${endereco}, ${numero}` : endereco;
      const query = encodeURIComponent(
        `${queryEndereco}, ${cidade}, ${estado}, Brasil`,
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            "User-Agent":
              "OndeDoarIO/1.0 - ondedoar.io (edudeveloperctk@gmail.com)",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
        }
      }
    }

    // Busca usuário no banco pelo email da sessão
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Monta payload de criação
    const createData: any = {
      nome,
      descricao: descricao || null,
      endereco,
      numero: numero,
      cidade,
      estado,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      user_id: user?.id ?? null, // vincula ao usuário se existir
    };

    // Adiciona categorias se houver
    if (categoriasIds.length > 0) {
      createData.ponto_categorias = {
        create: categoriasIds.map((id) => ({
          categoria_id: id,
        })),
      };
    }

    // Cria o ponto
    await prisma.pontoColeta.create({
      data: createData,
    });

    // Revalida a rota raiz e redireciona para sucesso
    revalidatePath("/");
    redirect("/?success=1");
  } catch (error) {
    console.error("Erro ao cadastrar ponto:", error);
    redirect("/cadastrar?error=1");
  }
}
