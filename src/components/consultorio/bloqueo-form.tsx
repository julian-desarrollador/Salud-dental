"use client";

import Link from "next/link";
import { useState } from "react";
import { guardarBloqueo } from "@/app/consultorio/agenda/actions";
import { horariosDeFin, horariosDeInicio } from "@/lib/consultorio/agenda-horario";
import { CalendarioCampo } from "@/components/consultorio/calendario-campo";

export function BloqueoForm({ dia }: { dia: string }) {
  const [dateKey, setDateKey] = useState(dia);
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("14:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function guardar() {
    setError("");
    setPending(true);
    const result = await guardarBloqueo({ dateKey, start, end, note });
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/consultorio/agenda?dia=${dia}`} className="text-forest">
        Agenda
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-forest">Bloquear horario</h1>
      <p className="mt-2 text-muted">Para un almuerzo o un hueco. No se agenda un paciente.</p>
      <div className="mt-6 grid gap-4">
        <label className="text-forest" htmlFor="dia">
          Día
        </label>
        <CalendarioCampo id="dia" value={dateKey} onChange={setDateKey} />
        <label className="text-forest" htmlFor="desde">
          Desde
        </label>
        <select
          id="desde"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
        >
          {horariosDeInicio().map((hora) => (
            <option key={hora}>{hora}</option>
          ))}
        </select>
        <label className="text-forest" htmlFor="hasta">
          Hasta
        </label>
        <select
          id="hasta"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
        >
          {horariosDeFin().map((hora) => (
            <option key={hora}>{hora}</option>
          ))}
        </select>
        <label className="text-forest" htmlFor="nota">
          Nota
        </label>
        <input
          id="nota"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Almuerzo"
          className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
        />
      </div>
      {error ? <p className="mt-4 text-[#6b2e2a]">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void guardar()}
        className="mt-6 h-12 rounded-full bg-forest px-6 text-cream disabled:opacity-40"
      >
        Bloquear
      </button>
    </div>
  );
}
