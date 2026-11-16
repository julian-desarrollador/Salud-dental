"use client";

import { useState } from "react";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { fechaEnPalabras, todayInArgentina } from "@/lib/consultorio/fecha";
import { mover } from "@/lib/consultorio/odontograma";
import type { PasoPlan } from "@/lib/consultorio/types";

const accion =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-4 text-base text-forest disabled:cursor-default disabled:opacity-40";

export function PlanTratamiento({ plan, onChange }: { plan: PasoPlan[]; onChange: (plan: PasoPlan[]) => void }) {
  const [nuevoId, setNuevoId] = useState<string | null>(null);
  const [aQuitar, setAQuitar] = useState<PasoPlan | null>(null);

  function editar(id: string, cambios: Partial<PasoPlan>) {
    onChange(plan.map((paso) => (paso.id === id ? { ...paso, ...cambios } : paso)));
  }

  function quitar(paso: PasoPlan) {
    if (paso.text.trim()) setAQuitar(paso);
    else onChange(plan.filter((item) => item.id !== paso.id));
  }

  return (
    <div className="rounded-2xl border border-sand bg-white p-4">
      <h3 className="font-serif text-2xl">Plan de tratamiento</h3>
      <p className="mt-1 text-muted print:hidden">Escribí los pasos en el orden en que los vas a hacer y tildalos cuando estén hechos.</p>
      {plan.length === 0 ? <p className="mt-3 text-forest">Todavía no hay pasos.</p> : null}
      <ol className="mt-3 space-y-3">
        {plan.map((paso, indice) => (
          <li key={paso.id} className="rounded-xl border border-sand p-3">
            <div className="flex items-start gap-3">
              <span className="pt-2 font-serif text-2xl text-forest">{indice + 1}.</span>
              <textarea
                value={paso.text}
                rows={2}
                autoFocus={paso.id === nuevoId}
                maxLength={1000}
                aria-label={`Paso ${indice + 1}`}
                placeholder="Por ejemplo, limpieza"
                onChange={(event) => editar(paso.id, { text: event.target.value })}
                className={`w-full rounded-xl border border-sand bg-white px-3 py-2 text-lg print:hidden ${paso.done ? "text-muted line-through" : ""}`}
              />
              <p className="hidden whitespace-pre-wrap pt-2 text-forest print:block">
                {paso.done ? "☑" : "☐"} {paso.text || "Sin texto"}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-9">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-lg text-forest print:hidden">
                <input
                  type="checkbox"
                  className="h-6 w-6 accent-forest"
                  checked={paso.done}
                  onChange={(event) =>
                    editar(paso.id, { done: event.target.checked, doneOn: event.target.checked ? todayInArgentina() : "" })
                  }
                />
                Hecho
              </label>
              {paso.done && paso.doneOn ? <p className="text-muted">Hecho el {fechaEnPalabras(paso.doneOn)}</p> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 pl-9 print:hidden">
              <button type="button" className={accion} disabled={indice === 0} onClick={() => onChange(mover(plan, paso.id, -1))}>
                Subir
              </button>
              <button
                type="button"
                className={accion}
                disabled={indice === plan.length - 1}
                onClick={() => onChange(mover(plan, paso.id, 1))}
              >
                Bajar
              </button>
              <button type="button" className={accion} onClick={() => quitar(paso)}>
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={plan.length >= 100}
        onClick={() => {
          const paso: PasoPlan = { id: crypto.randomUUID(), text: "", done: false, doneOn: "" };
          setNuevoId(paso.id);
          onChange([...plan, paso]);
        }}
        className="mt-4 inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40 print:hidden"
      >
        Agregar paso
      </button>

      {aQuitar ? (
        <Confirmacion
          title="¿Quitar este paso?"
          text={`"${aQuitar.text.trim().slice(0, 80)}" sale del plan.`}
          confirm="Quitar"
          onConfirm={() => {
            onChange(plan.filter((item) => item.id !== aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </div>
  );
}
