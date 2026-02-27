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
      create: (args: unknown) => prismaPontoCreateMock(args),
    },
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
  formData.set("telefone", "31999999999");
  formData.set("whatsapp", "31988888888");
  formData.append("categorias", "cat-1");
  formData.append("categorias", "cat-2");

  return formData;
}

describe("cadastrarPonto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("cria ponto com número e categorias e redireciona com sucesso", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPontoCreateMock.mockResolvedValue({ id: "ponto-1" });

    await expect(cadastrarPonto(buildValidFormData())).rejects.toThrow(
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
    expect(createCallArg.data.ponto_categorias?.create).toEqual([
      { categoria_id: "cat-1" },
      { categoria_id: "cat-2" },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
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
