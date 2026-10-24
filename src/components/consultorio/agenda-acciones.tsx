"use client";

import { useState } from "react";
import { anularTurno, borrarBloqueo } from "@/app/consultorio/agenda/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";

export function CancelarTurno({ id, dia }: { id: string; dia: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button type="button" className="shrink-0 text-[#6b2e2a]" onClick={() => setAsk(true)}>
        Cancelar turno
      </button>
      {ask ? (
        <Confirmacion
          title="¿Cancelar este turno?"
          text="El horario queda libre."
          confirm="Sí, cancelar"
          onClose={() => {
            if (!pending) setAsk(false);
          }}
          onConfirm={() => {
            if (pending) return;
            setPending(true);
            void anularTurno(id, dia);
          }}
        />
      ) : null}
    </>
  );
}

export function QuitarBloqueo({ id, dia }: { id: string; dia: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-4 text-[#6b2e2a] disabled:opacity-40"
      onClick={() => {
        setPending(true);
        void borrarBloqueo(id, dia);
      }}
    >
      Quitar bloqueo
    </button>
  );
}
