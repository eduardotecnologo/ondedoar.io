// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const isRedirectErrorMock = vi.fn((error: unknown) => {
  return error instanceof Error && error.message.startsWith("NEXT_REDIRECT:");
});

const prismaUserFindUniqueMock = vi.fn();
const prismaUserUpdateMock = vi.fn();

const bcryptCompareMock = vi.fn();
const bcryptHashMock = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
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
      update: (args: unknown) => prismaUserUpdateMock(args),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: (...args: unknown[]) => bcryptCompareMock(...args),
    hash: (...args: unknown[]) => bcryptHashMock(...args),
  },
}));

import { alterarSenha } from "./account";

function buildFormData(
  senhaAtual = "senha-atual",
  novaSenha = "nova-senha-123",
  confirmarNovaSenha = "nova-senha-123",
): FormData {
  const formData = new FormData();
  formData.set("senhaAtual", senhaAtual);
  formData.set("novaSenha", novaSenha);
  formData.set("confirmarNovaSenha", confirmarNovaSenha);
  return formData;
}

describe("alterarSenha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona para login sem sessão", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(alterarSenha(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=auth_required",
    );
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando senha atual não confere", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hash-antigo",
    });
    bcryptCompareMock.mockResolvedValue(false);

    await expect(alterarSenha(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard?pwd_error=wrong_current_password",
    );

    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("altera senha e redireciona com sucesso", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hash-antigo",
    });
    bcryptCompareMock.mockResolvedValue(true);
    bcryptHashMock.mockResolvedValue("hash-novo");
    prismaUserUpdateMock.mockResolvedValue({ id: "user-1" });

    await expect(alterarSenha(buildFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard?pwd_success=1",
    );

    expect(prismaUserUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "hash-novo" },
    });
  });
});
