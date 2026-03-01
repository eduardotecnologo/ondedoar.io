// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const revalidatePathMock = vi.fn();
const isRedirectErrorMock = vi.fn((error: unknown) => {
  return error instanceof Error && error.message.startsWith("NEXT_REDIRECT:");
});

const prismaUserFindUniqueMock = vi.fn();
const prismaPontoCreateMock = vi.fn();
const prismaTipoDoacaoFindFirstMock = vi.fn();
const prismaExecuteRawMock = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) => isRedirectErrorMock(error),
}));

vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: (args: unknown) => prismaUserFindUniqueMock(args),
    },
    tipoDoacao: {
      findFirst: (args: unknown) => prismaTipoDoacaoFindFirstMock(args),
    },
    pontoColeta: {
      create: (args: unknown) => prismaPontoCreateMock(args),
    },
    $executeRaw: (...args: unknown[]) => prismaExecuteRawMock(...args),
  },
}));

import { cadastrarPonto } from "./pontos";

function buildValidFormData(): FormData {
  const formData = new FormData();
  formData.set("nome", "Ponto Esperança");
  formData.set("descricao", "Aceitamos alimentos");
  formData.set("endereco", "Rua A");
  formData.set("numero", "123");
  formData.set("cidade", "Juiz de Fora");
  formData.set("estado", "MG");
  formData.set("cep", "36000-000");
  formData.set("telefone", "31999999999");
  formData.set("whatsapp", "31988888888");
  formData.append("categorias", "cat-1");
  formData.append("categorias", "cat-2");

  return formData;
}

function buildImageFile(
  name = "foto.png",
  type = "image/png",
  size = 1024,
): File {
  const content = new Uint8Array(size).fill(1);
  return new File([content], name, { type });
}

describe("cadastrarPonto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTipoDoacaoFindFirstMock.mockResolvedValue(null);
    prismaExecuteRawMock.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "-23.5", lon: "-46.6" }],
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redireciona para login quando não há sessão", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(cadastrarPonto(buildValidFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=auth_required",
    );
    expect(prismaPontoCreateMock).not.toHaveBeenCalled();
  });

  it("redireciona quando cep está vazio", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    formData.set("cep", "  ");

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=1",
    );
  });

  it("redireciona quando não há categorias", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    formData.delete("categorias");

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=no_category",
    );
  });

  it("redireciona quando há fotos demais", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    for (let i = 0; i < 9; i += 1) {
      formData.append("foto_ponto", buildImageFile(`foto-${i}.png`));
    }

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=too_many_photos",
    );
  });

  it("redireciona quando total das fotos excede limite", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    formData.append(
      "foto_ponto",
      buildImageFile("a.png", "image/png", 7 * 1024 * 1024),
    );
    formData.append(
      "foto_ponto",
      buildImageFile("b.png", "image/png", 6 * 1024 * 1024),
    );

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=photo_total_too_large",
    );
  });

  it("redireciona quando foto não é imagem", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    formData.append(
      "foto_ponto",
      buildImageFile("doc.txt", "text/plain", 1024),
    );

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=invalid_photo",
    );
  });

  it("redireciona quando foto individual excede 4MB", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData();
    formData.append(
      "foto_ponto",
      buildImageFile("grande.png", "image/png", 5 * 1024 * 1024),
    );

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=photo_too_large",
    );
  });

  it("cria ponto com número e categorias e redireciona com sucesso", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoCreateMock.mockResolvedValue({ id: "ponto-1" });

    const formData = buildValidFormData();
    formData.set("website", "@ondedoar");
    formData.append(
      "foto_ponto",
      buildImageFile("foto.png", "image/png", 1200),
    );

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/?success=1",
    );

    expect(prismaPontoCreateMock).toHaveBeenCalledTimes(1);

    const createCallArg = prismaPontoCreateMock.mock.calls[0][0] as {
      data: {
        numero: string;
        endereco: string;
        ponto_categorias?: {
          create: Array<{ categoria_id: string }>;
        };
      };
    };

    expect(createCallArg.data.endereco).toBe("Rua A");
    expect(createCallArg.data.numero).toBe("123");
    expect(createCallArg.data.descricao).toContain(
      "Instagram: https://instagram.com/ondedoar",
    );
    expect(createCallArg.data.ponto_categorias?.create).toEqual([
      { categoria_id: "cat-1" },
      { categoria_id: "cat-2" },
    ]);
    expect(prismaExecuteRawMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("redireciona quando categoria de fraldas é selecionada sem público válido", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });

    prismaTipoDoacaoFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cat-fraldas" });

    const formData = buildValidFormData();
    formData.delete("categorias");
    formData.append("categorias", "cat-fraldas");
    formData.set("fraldas_publico", "idoso");

    await expect(cadastrarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=fraldas_publico",
    );
  });

  it("redireciona para erro quando create falha", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoCreateMock.mockRejectedValue(new Error("db fail"));

    await expect(cadastrarPonto(buildValidFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/cadastrar?error=1",
    );
  });
});
