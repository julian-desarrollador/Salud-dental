"use client";

import { useEffect } from "react";

export function Confirmacion({
  title,
  text,
  confirm,
  onConfirm,
  onClose,
}: {
  title: string;
  text: string;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        className="w-full max-w-sm rounded-[22px] border border-sand bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirmacion-titulo" className="font-serif text-3xl leading-tight text-forest">
          {title}
        </h2>
        <p className="mt-3 text-forest">{text}</p>
        <div className="mt-6 flex items-center justify-end gap-4">
          <button type="button" className="h-12 px-2 text-forest" onClick={onClose}>
            No
          </button>
          <button type="button" className="h-12 rounded-full bg-forest px-5 text-cream" onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
