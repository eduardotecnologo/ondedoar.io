import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PontoDetalhesButton from "./PontoDetalhesButton";

describe("PontoDetalhesButton", () => {
  it("mostra galeria quando fotosPonto está preenchido", () => {
    render(
      <PontoDetalhesButton
        titulo="Ponto Exemplo"
        detalhes="Coleta roupas"
        fotoPonto="data:image/png;base64,single"
        fotosPonto={[
          "data:image/png;base64,first",
          "data:image/png;base64,second",
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver Detalhes" }));

    expect(
      screen.getByRole("dialog", { name: "Detalhes de Ponto Exemplo" }),
    ).toBeInTheDocument();

    const image1 = screen.getByAltText("Imagem 1 de Ponto Exemplo");
    const image2 = screen.getByAltText("Imagem 2 de Ponto Exemplo");

    expect(image1).toHaveAttribute("src", "data:image/png;base64,first");
    expect(image2).toHaveAttribute("src", "data:image/png;base64,second");
  });

  it("usa fotoPonto como fallback e mostra mensagem sem detalhes", () => {
    render(
      <PontoDetalhesButton
        titulo="Ponto Sem Detalhes"
        detalhes="   "
        fotoPonto="data:image/png;base64,single"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver Detalhes" }));

    expect(
      screen.getByAltText("Imagem 1 de Ponto Sem Detalhes"),
    ).toHaveAttribute("src", "data:image/png;base64,single");

    expect(
      screen.getByText("Nenhum detalhe foi informado para este ponto."),
    ).toBeInTheDocument();
  });
});
