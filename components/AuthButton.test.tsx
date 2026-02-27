import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AuthButton from "./AuthButton";

const useSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signIn: vi.fn(),
  signOut: () => signOutMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AuthButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza estado de loading", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });

    const { container } = render(<AuthButton />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renderiza botão de login quando deslogado", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<AuthButton />);

    const loginLink = screen.getByRole("link", { name: "Entrar" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("renderiza painel e saída quando logado não admin", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "user@example.com", isAdmin: false } },
      status: "authenticated",
    });

    render(<AuthButton />);

    expect(screen.getByRole("link", { name: "Meu Painel" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.queryByRole("link", { name: "Admin" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("renderiza link admin quando usuário é admin", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "admin@example.com", isAdmin: true } },
      status: "authenticated",
    });

    render(<AuthButton />);

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
