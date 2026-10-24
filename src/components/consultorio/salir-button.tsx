"use client";

import { useState } from "react";
import { logout } from "@/app/consultorio/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";

export function SalirButton() {
  const [ask, setAsk] = useState(false);

  return (
    <>
      <button type="button" className="inline-flex h-12 items-center text-forest" onClick={() => setAsk(true)}>
        Salir
      </button>
      {ask ? (
        <Confirmacion
          title="¿Salir del consultorio?"
          text="Vas a tener que volver a ingresar."
          confirm="Salir"
          onClose={() => setAsk(false)}
          onConfirm={() => void logout()}
        />
      ) : null}
    </>
  );
}
