"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const FOTO_MAX_BYTES = 4 * 1024 * 1024;
const MAX_FOTOS = 8;
const MAX_TOTAL_FOTOS_BYTES = 12 * 1024 * 1024;

function asText(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function asBool(value: FormDataEntryValue | null): boolean {
  const raw = asText(value).toLowerCase();
  return raw === "on" || raw === "1" || raw === "true";
}

async function readUploadedImageAsDataUrl(
  value: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(value instanceof File)) return null;
  if (value.size === 0) return null;

  if (!value.type.startsWith("image/")) {
    throw new Error("invalid_photo");
  }

  if (value.size > FOTO_MAX_BYTES) {
    throw new Error("photo_too_large");
  }

  const bytes = await value.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${value.type};base64,${base64}`;
}

async function readUploadedImagesAsDataUrls(
  values: FormDataEntryValue[],
): Promise<string[]> {
  const files = values.filter(
    (item): item is File => item instanceof File && item.size > 0,
  );

  if (files.length === 0) return [];

  if (files.length > MAX_FOTOS) {
    throw new Error("too_many_photos");
  }

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  if (totalSize > MAX_TOTAL_FOTOS_BYTES) {
    throw new Error("photo_total_too_large");
  }

  const dataUrls: string[] = [];
  for (const file of files) {
    const dataUrl = await readUploadedImageAsDataUrl(file);
    if (dataUrl) dataUrls.push(dataUrl);
  }

  return dataUrls;
}

export async function cadastrarPessoaEncontrar(
  formData: FormData,
): Promise<void> {
  const nome = asText(formData.get("nome"));
  const contato = asText(formData.get("contato"));
  const cidade = asText(formData.get("cidade"));
  const estado = asText(formData.get("estado")).toUpperCase();
  const descricao = asText(formData.get("descricao"));
  const fotosRaw = formData.getAll("fotos");
  const anonimo = asBool(formData.get("anonimo"));

  const nomeFinal = anonimo ? "ANONIMO" : nome;

  if (!contato || !cidade || !estado || !descricao || (!anonimo && !nome)) {
    redirect("/encontrar-pessoas?error=required");
  }

  try {
    const fotosDataUrls = await readUploadedImagesAsDataUrls(fotosRaw);
    const fotoPrincipal = fotosDataUrls[0] ?? null;

    const insertedRows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO encontrar_pessoas (
        nome,
        contato,
        cidade,
        estado,
        descricao,
        foto_url,
        status,
        anonimo
      ) VALUES (
        ${nomeFinal},
        ${contato},
        ${cidade},
        ${estado},
        ${descricao},
        ${fotoPrincipal},
        ${"DESAPARECIDO"},
        ${anonimo}
      )
      RETURNING id
    `;

    const pessoaId = insertedRows[0]?.id;

    if (pessoaId && fotosDataUrls.length > 0) {
      await prisma.$executeRaw`
        DELETE FROM encontrar_pessoas_imagens
        WHERE pessoa_id = ${pessoaId}::uuid
      `;

      for (const [index, imagemData] of fotosDataUrls.entries()) {
        await prisma.$executeRaw`
          INSERT INTO encontrar_pessoas_imagens (pessoa_id, imagem_data, ordem)
          VALUES (${pessoaId}::uuid, ${imagemData}, ${index})
        `;
      }
    }

    revalidatePath("/encontrar-pessoas");
    redirect("/encontrar-pessoas?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error && error.message === "invalid_photo") {
      redirect("/encontrar-pessoas?error=invalid_photo");
    }
    if (error instanceof Error && error.message === "photo_too_large") {
      redirect("/encontrar-pessoas?error=photo_too_large");
    }
    if (error instanceof Error && error.message === "too_many_photos") {
      redirect("/encontrar-pessoas?error=too_many_photos");
    }
    if (error instanceof Error && error.message === "photo_total_too_large") {
      redirect("/encontrar-pessoas?error=photo_total_too_large");
    }
    console.error("Erro ao cadastrar pessoa desaparecida:", error);
    redirect("/encontrar-pessoas?error=save");
  }
}

export async function marcarPessoaComoEncontrada(
  formData: FormData,
): Promise<void> {
  const id = asText(formData.get("id"));
  const encontradoPorNome = asText(formData.get("encontrado_por_nome"));
  const encontradoPorAnonimo = asBool(formData.get("encontrado_por_anonimo"));

  if (!id) {
    redirect("/encontrar-pessoas?error=invalid");
  }

  if (!encontradoPorAnonimo && !encontradoPorNome) {
    redirect("/encontrar-pessoas?error=attendant_required");
  }

  const nomeFinal = encontradoPorAnonimo ? "ANONIMO" : encontradoPorNome;

  try {
    await prisma.$executeRaw`
      UPDATE encontrar_pessoas
      SET
        status = 'ENCONTRADO',
        encontrado_por_nome = ${nomeFinal},
        encontrado_por_anonimo = ${encontradoPorAnonimo},
        encontrado_em = now(),
        atualizado_em = now()
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/encontrar-pessoas");
    redirect("/encontrar-pessoas?success=found");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao marcar pessoa como encontrada:", error);
    redirect("/encontrar-pessoas?error=save");
  }
}

export async function cadastrarAnimalEncontrar(
  formData: FormData,
): Promise<void> {
  const nome = asText(formData.get("nome"));
  const contato = asText(formData.get("contato"));
  const cidade = asText(formData.get("cidade"));
  const estado = asText(formData.get("estado")).toUpperCase();
  const especie = asText(formData.get("especie")).toUpperCase() || "OUTRO";
  const descricao = asText(formData.get("descricao"));
  const fotosRaw = formData.getAll("fotos");
  const anonimo = asBool(formData.get("anonimo"));

  const nomeFinal = anonimo ? "ANONIMO" : nome;

  if (!contato || !cidade || !estado || !descricao || (!anonimo && !nome)) {
    redirect("/encontrar-animais?error=required");
  }

  try {
    const fotosDataUrls = await readUploadedImagesAsDataUrls(fotosRaw);
    const fotoPrincipal = fotosDataUrls[0] ?? null;

    const insertedRows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO encontrar_animais (
        nome,
        contato,
        cidade,
        estado,
        especie,
        descricao,
        foto_url,
        status,
        anonimo
      ) VALUES (
        ${nomeFinal},
        ${contato},
        ${cidade},
        ${estado},
        ${especie},
        ${descricao},
        ${fotoPrincipal},
        ${"DESAPARECIDO"},
        ${anonimo}
      )
      RETURNING id
    `;

    const animalId = insertedRows[0]?.id;

    if (animalId && fotosDataUrls.length > 0) {
      await prisma.$executeRaw`
        DELETE FROM encontrar_animais_imagens
        WHERE animal_id = ${animalId}::uuid
      `;

      for (const [index, imagemData] of fotosDataUrls.entries()) {
        await prisma.$executeRaw`
          INSERT INTO encontrar_animais_imagens (animal_id, imagem_data, ordem)
          VALUES (${animalId}::uuid, ${imagemData}, ${index})
        `;
      }
    }

    revalidatePath("/encontrar-animais");
    redirect("/encontrar-animais?success=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error && error.message === "invalid_photo") {
      redirect("/encontrar-animais?error=invalid_photo");
    }
    if (error instanceof Error && error.message === "photo_too_large") {
      redirect("/encontrar-animais?error=photo_too_large");
    }
    if (error instanceof Error && error.message === "too_many_photos") {
      redirect("/encontrar-animais?error=too_many_photos");
    }
    if (error instanceof Error && error.message === "photo_total_too_large") {
      redirect("/encontrar-animais?error=photo_total_too_large");
    }
    console.error("Erro ao cadastrar animal desaparecido:", error);
    redirect("/encontrar-animais?error=save");
  }
}

export async function marcarAnimalComoEncontrado(
  formData: FormData,
): Promise<void> {
  const id = asText(formData.get("id"));
  const encontradoPorNome = asText(formData.get("encontrado_por_nome"));
  const encontradoPorAnonimo = asBool(formData.get("encontrado_por_anonimo"));

  if (!id) {
    redirect("/encontrar-animais?error=invalid");
  }

  if (!encontradoPorAnonimo && !encontradoPorNome) {
    redirect("/encontrar-animais?error=attendant_required");
  }

  const nomeFinal = encontradoPorAnonimo ? "ANONIMO" : encontradoPorNome;

  try {
    await prisma.$executeRaw`
      UPDATE encontrar_animais
      SET
        status = 'ENCONTRADO',
        encontrado_por_nome = ${nomeFinal},
        encontrado_por_anonimo = ${encontradoPorAnonimo},
        encontrado_em = now(),
        atualizado_em = now()
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/encontrar-animais");
    redirect("/encontrar-animais?success=found");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Erro ao marcar animal como encontrado:", error);
    redirect("/encontrar-animais?error=save");
  }
}
