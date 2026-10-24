"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-lg text-cream print:hidden"
    >
      Imprimir
    </button>
  );
}
