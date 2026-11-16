"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createPatient } from "@/app/consultorio/actions";
import { fechaEnPalabras } from "@/lib/consultorio/fecha";
import type { Patient } from "@/lib/consultorio/types";

const secundario =
  "inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-forest bg-white px-5 text-lg text-forest";

function ultimaVisita(patient: Patient) {
  const last = (patient.evolution ?? []).map((note) => note.date).sort().at(-1);
  if (!last) return "Sin visitas";
  return `Última visita: ${fechaEnPalabras(last)}`;
}

function BotonCrear({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-lg text-cream disabled:opacity-60"
    >
      {pending ? "Creando…" : children}
    </button>
  );
}

export function Lupa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="10.5" cy="10.5" r="6" />
      <path strokeLinecap="round" d="m15 15 5 5" />
    </svg>
  );
}

export function ListaPacientes({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  const [alta, setAlta] = useState(false);
  const buscador = useRef<HTMLInputElement>(null);
  const texto = query.trim();

  const visible = useMemo(() => {
    const text = texto.toLocaleLowerCase("es");
    if (!text) return patients;
    return patients.filter((patient) =>
      `${patient.name} ${patient.contact ?? ""} ${patient.document ?? ""}`.toLocaleLowerCase("es").includes(text),
    );
  }, [patients, texto]);

  // En la computadora se puede escribir directo; en el celular no se abre el teclado solo.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) buscador.current?.focus();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-4xl text-forest md:text-5xl">Pacientes</h1>
          <span className="mt-4 block h-0.5 w-16 bg-gold" />
        </div>
        {alta ? null : (
          <button type="button" aria-label="Nuevo paciente" className={`${secundario} px-4 sm:px-5`} onClick={() => setAlta(true)}>
            <span aria-hidden="true">+</span>
            <span aria-hidden="true" className="sm:hidden">Nuevo</span>
            <span aria-hidden="true" className="hidden sm:inline">Nuevo paciente</span>
          </button>
        )}
      </div>

      {alta ? (
        <form action={createPatient} className="mt-6 rounded-2xl border border-sand bg-white p-4">
          <label className="block text-forest" htmlFor="nuevo-paciente">
            Nombre del paciente
          </label>
          <input
            id="nuevo-paciente"
            name="name"
            required
            autoFocus
            defaultValue={texto}
            autoComplete="off"
            className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <BotonCrear>Crear ficha</BotonCrear>
            <button type="button" className={secundario} onClick={() => setAlta(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <label className="mt-8 block text-forest" htmlFor="buscar">
        Buscar por nombre, teléfono o documento
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          <Lupa />
        </span>
        <input
          id="buscar"
          ref={buscador}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-14 w-full rounded-xl border border-sand bg-white pr-4 pl-12 text-lg text-forest"
        />
      </div>
      <p className="mt-2 text-muted" aria-live="polite">
        {texto
          ? `${visible.length} de ${patients.length}`
          : `${patients.length} ${patients.length === 1 ? "paciente" : "pacientes"}`}
      </p>

      {visible.length === 0 ? (
        texto ? (
          <form action={createPatient} className="mt-6">
            <p className="text-forest">No hay nadie con «{texto}».</p>
            <input type="hidden" name="name" value={texto} />
            <div className="mt-3">
              <BotonCrear>Crear ficha de {texto}</BotonCrear>
            </div>
          </form>
        ) : (
          <p className="mt-6 text-forest">Todavía no hay pacientes. Tocá “Nuevo paciente” para cargar el primero.</p>
        )
      ) : (
        <ul className="mt-4 divide-y divide-sand">
          {visible.map((patient) => (
            <li key={patient.id}>
              <Link href={`/consultorio/pacientes/${patient.id}`} className="block py-4">
                <span className="block font-serif text-3xl text-forest">{patient.name}</span>
                {patient.contact ? <span className="mt-1 block text-muted">{patient.contact}</span> : null}
                <span className="mt-1 block text-forest">{ultimaVisita(patient)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
