// @vitest-environment node

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const isRedirectErrorMock = vi.fn((error: unknown) => {
  return error instanceof Error && error.message.startsWith("NEXT_REDIRECT:");
});

const prismaUserFindUniqueMock = vi.fn();
const prismaUserUpdateMock = vi.fn();
const prismaPasswordResetDeleteManyMock = vi.fn();
const prismaPasswordResetCreateMock = vi.fn();
const prismaPasswordResetFindFirstMock = vi.fn();

const prismaTxUserUpdateMock = vi.fn();
const prismaTxPasswordResetUpdateMock = vi.fn();
const prismaTxPasswordResetDeleteManyMock = vi.fn();
const prismaTransactionMock = vi.fn();

const bcryptCompareMock = vi.fn();
const bcryptHashMock = vi.fn();

const nodemailerSendMailMock = vi.fn();
const nodemailerCreateTransportMock = vi.fn(() => ({
  sendMail: (...args: unknown[]) => nodemailerSendMailMock(...args),
}));

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
    passwordResetToken: {
      deleteMany: (args: unknown) => prismaPasswordResetDeleteManyMock(args),
      create: (args: unknown) => prismaPasswordResetCreateMock(args),
      findFirst: (args: unknown) => prismaPasswordResetFindFirstMock(args),
    },
    $transaction: (callback: unknown) => prismaTransactionMock(callback),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: (...args: unknown[]) => bcryptCompareMock(...args),
    hash: (...args: unknown[]) => bcryptHashMock(...args),
  },
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) =>
      nodemailerCreateTransportMock(...args),
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    constructor(_apiKey: string) {}

    emails = {
      send: vi.fn().mockResolvedValue({ error: null }),
    };
  },
}));

import {
  alterarSenha,
  redefinirSenhaComToken,
  solicitarResetSenha,
} from "./account";

const ORIGINAL_ENV = process.env;

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

function buildSolicitarResetFormData(email = "user@example.com"): FormData {
  const formData = new FormData();
  formData.set("email", email);
  return formData;
}

function buildRedefinirSenhaFormData(
  token = "token-exemplo",
  novaSenha = "nova-senha-123",
  confirmarNovaSenha = "nova-senha-123",
): FormData {
  const formData = new FormData();
  formData.set("token", token);
  formData.set("novaSenha", novaSenha);
  formData.set("confirmarNovaSenha", confirmarNovaSenha);
  return formData;
}

describe("alterarSenha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };

    prismaTransactionMock.mockImplementation(async (callback: unknown) => {
      const cb = callback as (tx: {
        user: { update: (args: unknown) => Promise<unknown> };
        passwordResetToken: {
          update: (args: unknown) => Promise<unknown>;
          deleteMany: (args: unknown) => Promise<unknown>;
        };
      }) => Promise<unknown>;

      return cb({
        user: {
          update: (args: unknown) => prismaTxUserUpdateMock(args),
        },
        passwordResetToken: {
          update: (args: unknown) => prismaTxPasswordResetUpdateMock(args),
          deleteMany: (args: unknown) =>
            prismaTxPasswordResetDeleteManyMock(args),
        },
      });
    });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
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

describe("solicitarResetSenha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it("redireciona com erro quando email está ausente", async () => {
    const formData = new FormData();

    await expect(solicitarResetSenha(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/esqueci-senha?error=missing_email",
    );
  });

  it("em produção sem provider de email redireciona para indisponível", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;

    await expect(
      solicitarResetSenha(buildSolicitarResetFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/esqueci-senha?error=email_unavailable");

    expect(prismaUserFindUniqueMock).not.toHaveBeenCalled();
  });

  it("gera token, envia por Resend e redireciona com status enviado", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "resend-key";
    process.env.RESEND_FROM = "onboarding@resend.dev";
    process.env.NEXTAUTH_URL = "https://ondedoar.io";

    prismaUserFindUniqueMock.mockResolvedValue({ id: "user-1" });
    prismaPasswordResetDeleteManyMock.mockResolvedValue({ count: 0 });
    prismaPasswordResetCreateMock.mockResolvedValue({ id: "token-1" });

    await expect(
      solicitarResetSenha(buildSolicitarResetFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/esqueci-senha?status=sent");

    expect(prismaPasswordResetDeleteManyMock).toHaveBeenCalledWith({
      where: { user_id: "user-1" },
    });
    expect(prismaPasswordResetCreateMock).toHaveBeenCalledTimes(1);

    const createTokenPayload = prismaPasswordResetCreateMock.mock
      .calls[0][0] as {
      data: {
        user_id: string;
        token_hash: string;
        expires_at: Date;
      };
    };

    expect(createTokenPayload.data.user_id).toBe("user-1");
    expect(createTokenPayload.data.token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(createTokenPayload.data.expires_at).toBeInstanceOf(Date);
  });
});

describe("redefinirSenhaComToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };

    prismaTransactionMock.mockImplementation(async (callback: unknown) => {
      const cb = callback as (tx: {
        user: { update: (args: unknown) => Promise<unknown> };
        passwordResetToken: {
          update: (args: unknown) => Promise<unknown>;
          deleteMany: (args: unknown) => Promise<unknown>;
        };
      }) => Promise<unknown>;

      return cb({
        user: {
          update: (args: unknown) => prismaTxUserUpdateMock(args),
        },
        passwordResetToken: {
          update: (args: unknown) => prismaTxPasswordResetUpdateMock(args),
          deleteMany: (args: unknown) =>
            prismaTxPasswordResetDeleteManyMock(args),
        },
      });
    });
  });

  it("redireciona quando token é inválido ou expirado", async () => {
    prismaPasswordResetFindFirstMock.mockResolvedValue(null);

    await expect(
      redefinirSenhaComToken(buildRedefinirSenhaFormData()),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/redefinir-senha?error=invalid_or_expired",
    );
  });

  it("redefine senha com sucesso, marca token usado e remove tokens antigos", async () => {
    prismaPasswordResetFindFirstMock.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      user: { id: "user-1" },
    });
    bcryptHashMock.mockResolvedValue("hash-novo");
    prismaTxUserUpdateMock.mockResolvedValue({ id: "user-1" });
    prismaTxPasswordResetUpdateMock.mockResolvedValue({ id: "reset-1" });
    prismaTxPasswordResetDeleteManyMock.mockResolvedValue({ count: 0 });

    await expect(
      redefinirSenhaComToken(buildRedefinirSenhaFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/login?reset=success");

    expect(prismaTxUserUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "hash-novo" },
    });
    expect(prismaTxPasswordResetUpdateMock).toHaveBeenCalledWith({
      where: { id: "reset-1" },
      data: { used_at: expect.any(Date) },
    });
    expect(prismaTxPasswordResetDeleteManyMock).toHaveBeenCalledWith({
      where: {
        user_id: "user-1",
        id: { not: "reset-1" },
      },
    });
  });
});
