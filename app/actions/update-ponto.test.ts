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
const prismaPontoFindUniqueMock = vi.fn();
const prismaPontoUpdateMock = vi.fn();
const prismaTipoDoacaoFindFirstMock = vi.fn();
const prismaCategoriasDeleteManyMock = vi.fn();
const prismaCategoriasCreateManyMock = vi.fn();
const prismaExecuteRawMock = vi.fn();
const prismaTransactionMock = vi.fn();

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
    pontoColeta: {
      findUnique: (args: unknown) => prismaPontoFindUniqueMock(args),
      update: (args: unknown) => prismaPontoUpdateMock(args),
    },
    tipoDoacao: {
      findFirst: (args: unknown) => prismaTipoDoacaoFindFirstMock(args),
    },
    pontoCategoria: {
      deleteMany: (args: unknown) => prismaCategoriasDeleteManyMock(args),
      createMany: (args: unknown) => prismaCategoriasCreateManyMock(args),
    },
    $executeRaw: (...args: unknown[]) => prismaExecuteRawMock(...args),
    $transaction: (fn: unknown) => prismaTransactionMock(fn),
  },
}));

import { atualizarPonto } from "./update-ponto";

function buildValidFormData(pontoId = "ponto-abc"): FormData {
  const formData = new FormData();
  formData.set("id", pontoId);
  formData.set("nome", "Ponto Atualizado");
  formData.set("descricao", "Descrição atualizada");
  formData.set("endereco", "Rua B");
  formData.set("numero", "456");
  formData.set("cidade", "Porto Alegre");
  formData.set("estado", "RS");
  formData.set("cep", "90000-000");
  formData.set("telefone", "51999999999");
  formData.set("whatsapp", "51988888888");
  formData.set("status_doacao", "ATIVO");
  formData.append("categorias", "cat-1");
  return formData;
}

describe("atualizarPonto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTipoDoacaoFindFirstMock.mockResolvedValue(null);
    prismaExecuteRawMock.mockResolvedValue(1);

    // $transaction executa a função passada com um tx que imita o prisma
    prismaTransactionMock.mockImplementation(
      async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          pontoColeta: { update: prismaPontoUpdateMock },
          pontoCategoria: {
            deleteMany: prismaCategoriasDeleteManyMock,
            createMany: prismaCategoriasCreateManyMock,
          },
          $executeRaw: prismaExecuteRawMock,
        };
        return fn(tx);
      },
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "-30.0", lon: "-51.2" }],
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redireciona para login quando não há sessão", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(atualizarPonto(buildValidFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=auth_required",
    );
    expect(prismaTransactionMock).not.toHaveBeenCalled();
  });

  it("redireciona quando campos obrigatórios estão ausentes", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const formData = buildValidFormData("ponto-xyz");
    formData.set("nome", "  "); // nome em branco

    await expect(atualizarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/pontos/ponto-xyz/editar?error=missing_fields",
    );
  });

  it("redireciona quando ponto não existe", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoFindUniqueMock.mockResolvedValue(null);

    await expect(
      atualizarPonto(buildValidFormData("ponto-abc")),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard?error=ponto_not_found");
  });

  it("redireciona quando usuário não é dono do ponto", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "outro@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-outro" });
    prismaPontoFindUniqueMock.mockResolvedValue({
      id: "ponto-abc",
      user_id: "user-dono",
      latitude: null,
      longitude: null,
    });

    await expect(
      atualizarPonto(buildValidFormData("ponto-abc")),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard?error=not_allowed");
  });

  it("redireciona quando FRALDAS é selecionado sem público válido", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoFindUniqueMock.mockResolvedValue({
      id: "ponto-abc",
      user_id: "user-1",
      latitude: null,
      longitude: null,
    });

    // findFirst: voluntario=null, fraldas=cat-fraldas
    prismaTipoDoacaoFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cat-fraldas" });

    const formData = buildValidFormData("ponto-abc");
    formData.delete("categorias");
    formData.append("categorias", "cat-fraldas");
    formData.set("fraldas_publico", "invalido");

    await expect(atualizarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/pontos/ponto-abc/editar?error=fraldas_publico",
    );
  });

  it("atualiza ponto com sucesso e redireciona para dashboard", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoFindUniqueMock.mockResolvedValue({
      id: "ponto-abc",
      user_id: "user-1",
      latitude: -30.0,
      longitude: -51.2,
    });
    prismaPontoUpdateMock.mockResolvedValue({});
    prismaCategoriasDeleteManyMock.mockResolvedValue({});
    prismaCategoriasCreateManyMock.mockResolvedValue({});

    await expect(
      atualizarPonto(buildValidFormData("ponto-abc")),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard?success=updated");

    expect(prismaTransactionMock).toHaveBeenCalledTimes(1);
    expect(prismaPontoUpdateMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("persiste campos de TRANSPORTE quando categoria TRANSPORTE é selecionada", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoFindUniqueMock.mockResolvedValue({
      id: "ponto-abc",
      user_id: "user-1",
      latitude: null,
      longitude: null,
    });
    prismaPontoUpdateMock.mockResolvedValue({});
    prismaCategoriasDeleteManyMock.mockResolvedValue({});
    prismaCategoriasCreateManyMock.mockResolvedValue({});

    // findFirst: voluntario=null, fraldas=null, transporte=cat-transporte
    prismaTipoDoacaoFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cat-transporte" });

    const formData = buildValidFormData("ponto-abc");
    formData.delete("categorias");
    formData.append("categorias", "cat-transporte");
    formData.set("transporte_tipo_veiculo", "GRANDE");
    formData.set("transporte_disponivel_em", "2026-03-10T09:00");

    await expect(atualizarPonto(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard?success=updated",
    );

    // $executeRaw deve ter sido chamado (persiste transporte_tipo_veiculo e transporte_disponivel_em)
    expect(prismaExecuteRawMock).toHaveBeenCalledTimes(1);
  });

  it("redireciona para erro quando atualização falha", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoFindUniqueMock.mockResolvedValue({
      id: "ponto-abc",
      user_id: "user-1",
      latitude: null,
      longitude: null,
    });
    prismaTransactionMock.mockRejectedValue(new Error("db fail"));

    await expect(
      atualizarPonto(buildValidFormData("ponto-abc")),
    ).rejects.toThrow("NEXT_REDIRECT:/pontos/ponto-abc/editar?error=1");
  });
});
