"use client";

interface VerNoMapaButtonProps {
  pontoId: string;
  disabled?: boolean;
}

export default function VerNoMapaButton({
  pontoId,
  disabled = false,
}: VerNoMapaButtonProps) {
  function handleClick() {
    if (disabled) return;

    window.dispatchEvent(
      new CustomEvent("ondedoar:focus-ponto", {
        detail: { pontoId },
      }),
    );

    document
      .getElementById("mapa-pontos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-3 rounded-xl font-bold text-sm transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
    >
      Ver no Mapa
    </button>
  );
}
