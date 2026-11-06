"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { savePreguntasMedicas } from "@/app/consultorio/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import {
  MAX_NIVELES,
  agregarSubpregunta,
  editarPregunta,
  moverPregunta,
  nuevaPregunta,
  quitarPregunta,
  sanitizePreguntas,
} from "@/lib/consultorio/preguntas";
import type { PreguntaMedica, RespuestaSiNo, TipoPregunta } from "@/lib/consultorio/types";

const accion =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-4 text-base text-forest disabled:cursor-default disabled:opacity-40";

const etiquetaTipo: Record<TipoPregunta, string> = {
  sino: "Se responde Sí o No",
  texto: "Se responde con texto",
};

type Acciones = {
  nuevaId: string | null;
  onEditar: (id: string, cambios: Partial<Pick<PreguntaMedica, "text" | "showWhen">>) => void;
  onMover: (id: string, salto: -1 | 1) => void;
  onQuitar: (pregunta: PreguntaMedica) => void;
  onAgregarSub: (padreId: string, kind: TipoPregunta) => void;
};

function TarjetaPregunta({
  pregunta,
  nivel,
  esPrimera,
  esUltima,
  acciones,
}: {
  pregunta: PreguntaMedica;
  nivel: number;
  esPrimera: boolean;
  esUltima: boolean;
  acciones: Acciones;
}) {
  return (
    <li className="rounded-2xl border border-sand bg-white p-4">
      <label className="block">
        {nivel === 1 ? "Pregunta" : "Subpregunta"}
        <input
          value={pregunta.text}
          maxLength={200}
          autoFocus={acciones.nuevaId === pregunta.id}
          onChange={(event) => acciones.onEditar(pregunta.id, { text: event.target.value })}
          className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
        />
      </label>
      <p className="mt-2 text-muted">{etiquetaTipo[pregunta.kind]}</p>
      {nivel > 1 ? (
        <label className="mt-3 block">
          Aparece si responde
          <select
            value={pregunta.showWhen ?? "si"}
            onChange={(event) => acciones.onEditar(pregunta.id, { showWhen: event.target.value as RespuestaSiNo })}
            className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={accion} disabled={esPrimera} onClick={() => acciones.onMover(pregunta.id, -1)}>
          Subir
        </button>
        <button type="button" className={accion} disabled={esUltima} onClick={() => acciones.onMover(pregunta.id, 1)}>
          Bajar
        </button>
        <button type="button" className={accion} onClick={() => acciones.onQuitar(pregunta)}>
          Quitar
        </button>
      </div>
      {pregunta.kind === "sino" && pregunta.children.length > 0 ? (
        <ul className="mt-4 space-y-3 border-l border-sand pl-3 sm:pl-4">
          {pregunta.children.map((hija, indice) => (
            <TarjetaPregunta
              key={hija.id}
              pregunta={hija}
              nivel={nivel + 1}
              esPrimera={indice === 0}
              esUltima={indice === pregunta.children.length - 1}
              acciones={acciones}
            />
          ))}
        </ul>
      ) : null}
      {pregunta.kind === "sino" && nivel < MAX_NIVELES ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={accion} onClick={() => acciones.onAgregarSub(pregunta.id, "sino")}>
            Agregar subpregunta Sí/No
          </button>
          <button type="button" className={accion} onClick={() => acciones.onAgregarSub(pregunta.id, "texto")}>
            Agregar subpregunta de texto
          </button>
        </div>
      ) : null}
    </li>
  );
}

function problemaDe(preguntas: PreguntaMedica[]) {
  try {
    sanitizePreguntas(preguntas);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Revisá la lista de preguntas.";
  }
}

export function PreguntasEditor({ initial, volver }: { initial: PreguntaMedica[]; volver: string }) {
  const [preguntas, setPreguntas] = useState(initial);
  const [nuevaId, setNuevaId] = useState<string | null>(null);
  const [aQuitar, setAQuitar] = useState<PreguntaMedica | null>(null);
  const [guardado, setGuardado] = useState(() => JSON.stringify(initial));
  const [huboGuardado, setHuboGuardado] = useState(false);
  const [falloEn, setFalloEn] = useState<string | null>(null);

  const draft = JSON.stringify(preguntas);
  const problema = problemaDe(preguntas);
  const notice =
    problema ||
    (falloEn === draft
      ? "No se pudo guardar. Revisá la conexión."
      : draft !== guardado
        ? "Guardando…"
        : huboGuardado
          ? "Guardado"
          : "");

  useEffect(() => {
    if (draft === guardado || problema) return;
    const timer = setTimeout(async () => {
      try {
        const result = await savePreguntasMedicas(preguntas);
        if ("error" in result) {
          setFalloEn(draft);
          return;
        }
        setGuardado(draft);
        setHuboGuardado(true);
      } catch {
        setFalloEn(draft);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, guardado, preguntas, problema]);

  function agregar(kind: TipoPregunta) {
    const nueva = nuevaPregunta(kind, false);
    setNuevaId(nueva.id);
    setPreguntas((current) => [...current, nueva]);
  }

  const acciones: Acciones = {
    nuevaId,
    onEditar: (id, cambios) => setPreguntas((current) => editarPregunta(current, id, cambios)),
    onMover: (id, salto) => setPreguntas((current) => moverPregunta(current, id, salto)),
    onQuitar: setAQuitar,
    onAgregarSub: (padreId, kind) => {
      const nueva = nuevaPregunta(kind, true);
      setNuevaId(nueva.id);
      setPreguntas((current) => agregarSubpregunta(current, padreId, nueva));
    },
  };

  return (
    <div>
      <Link href={volver} className="inline-flex h-11 items-center justify-center rounded-2xl border border-sand bg-white px-4 text-forest">
        Atrás
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Mis preguntas</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">
        Esta lista aparece en los antecedentes médicos de todas las fichas. Si cambiás o quitás una pregunta, las respuestas que ya guardaste quedan en cada ficha.
      </p>
      {notice ? (
        <p className="fixed inset-x-0 bottom-20 z-30 bg-sand py-3 text-center text-forest md:bottom-0" role="status">
          {notice}
        </p>
      ) : null}

      {preguntas.length === 0 ? <p className="mt-8 text-forest">Todavía no hay preguntas.</p> : null}
      <ul className="mt-8 space-y-4">
        {preguntas.map((pregunta, indice) => (
          <TarjetaPregunta
            key={pregunta.id}
            pregunta={pregunta}
            nivel={1}
            esPrimera={indice === 0}
            esUltima={indice === preguntas.length - 1}
            acciones={acciones}
          />
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => agregar("sino")} className="inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream">
          Agregar pregunta Sí/No
        </button>
        <button type="button" onClick={() => agregar("texto")} className="inline-flex min-h-12 items-center rounded-full border border-forest bg-white px-5 text-lg text-forest">
          Agregar pregunta de texto
        </button>
      </div>

      {aQuitar ? (
        <Confirmacion
          title="¿Quitar esta pregunta?"
          text={`${aQuitar.text || "La pregunta en blanco"}${aQuitar.children.length > 0 ? " y sus subpreguntas salen" : " sale"} de tu lista. Las respuestas ya guardadas quedan en las fichas.`}
          confirm="Quitar"
          onConfirm={() => {
            setPreguntas((current) => quitarPregunta(current, aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </div>
  );
}
