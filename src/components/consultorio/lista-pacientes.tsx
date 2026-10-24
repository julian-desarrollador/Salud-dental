"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fechaEnPalabras } from "@/lib/consultorio/fecha";
import type { Patient } from "@/lib/consultorio/types";

function ultimaVisita(patient: Patient) {
  const last = (patient.evolution ?? []).map((note) => note.date).sort().at(-1);
  if (!last) return "Sin visitas";
  return `Última visita: ${fechaEnPalabras(last)}`;
}

export function ListaPacientes({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    if (!text) return patients;
    return patients.filter((patient) =>
      `${patient.name} ${patient.contact ?? ""} ${patient.document ?? ""}`.toLocaleLowerCase("es").includes(text),
    );
  }, [patients, query]);

  return (
    <div>
      <label className="block text-forest" htmlFor="buscar">
        Buscar por nombre o documento
      </label>
      <input
        id="buscar"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest"
      />
      {visible.length === 0 ? (
        <p className="mt-8 text-forest">{query ? "No hay nadie con ese nombre o documento." : "Todavía no hay pacientes."}</p>
      ) : (
        <ul className="mt-6 divide-y divide-sand">
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
