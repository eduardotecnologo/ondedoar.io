import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PontoImagemUploadField from "./PontoImagemUploadField";

vi.mock("next/image", () => ({
  default: ({
    alt,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => (
    <img alt={alt} {...props} />
  ),
}));

class DataTransferMock {
  private filesList: File[] = [];

  items = {
    add: (file: File) => {
      this.filesList.push(file);
    },
  };

  get files() {
    return this.filesList as unknown as FileList;
  }
}

describe("PontoImagemUploadField", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "DataTransfer",
      DataTransferMock as unknown as typeof DataTransfer,
    );

    Object.defineProperty(globalThis.URL, "createObjectURL", {
      writable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
    });

    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("acumula imagens em múltiplas seleções e permite remover individualmente", () => {
    const { container } = render(<PontoImagemUploadField />);
    const input = container.querySelector(
      'input[name="foto_ponto"]',
    ) as HTMLInputElement;

    const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const fileB = new File(["b"], "b.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [fileA] } });
    fireEvent.change(input, { target: { files: [fileB] } });

    expect(screen.getByText("Total: 2")).toBeInTheDocument();
    expect(
      screen.getByAltText("Pré-visualização da imagem 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Pré-visualização da imagem 2"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remover imagem 1" }));

    expect(screen.getByText("Total: 1")).toBeInTheDocument();
    expect(screen.queryByText("Total: 2")).not.toBeInTheDocument();
  });

  it("remove toda a galeria ao clicar em Remover", () => {
    const { container } = render(<PontoImagemUploadField />);
    const input = container.querySelector(
      'input[name="foto_ponto"]',
    ) as HTMLInputElement;

    const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [fileA] } });

    expect(screen.getByText("Pré-visualização")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remover" }));

    expect(screen.queryByText("Pré-visualização")).not.toBeInTheDocument();
    expect(screen.queryByText("Total: 1")).not.toBeInTheDocument();
  });
});
