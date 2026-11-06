"use client";

import Link from "next/link";
import { useState } from "react";
import { fechaEnPalabras, todayInArgentina } from "@/lib/consultorio/fecha";
import { respuestasRetiradas, resumenAntecedentes, subpreguntasVisibles } from "@/lib/consultorio/preguntas";
import type { PreguntaMedica, RespuestaMedica, RespuestasMedicas } from "@/lib/consultorio/types";

function Flecha({ abierta }: { abierta: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 transition-transform print:invisible ${abierta ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 4 6 6-6 6" />
    </svg>
  );
}

function valorEnPalabras(respuesta: Pick<RespuestaMedica, "kind" | "value">) {
  if (respuesta.kind === "texto") return respuesta.value;
  return respuesta.value === "si" ? "Sí" : "No";
}

function FechaRespuesta({ respuesta }: { respuesta: RespuestaMedica | undefined }) {
  if (!respuesta?.answeredOn) return null;
  return <p className="text-muted">Respondida el {fechaEnPalabras(respuesta.answeredOn)}</p>;
}

function RespondidaComo({ pregunta, respuesta }: { pregunta: PreguntaMedica; respuesta: RespuestaMedica | undefined }) {
  if (!respuesta?.question || respuesta.question === pregunta.text) return null;
  return <p className="pl-6 text-muted">Se respondió como: {respuesta.question}</p>;
}

function FilaPregunta({
  pregunta,
  nivel,
  respuestas,
  onResponder,
}: {
  pregunta: PreguntaMedica;
  nivel: number;
  respuestas: RespuestasMedicas;
  onResponder: (pregunta: PreguntaMedica, valor: string) => void;
}) {
  const [elegida, setElegida] = useState<boolean | null>(null);
  const respuesta = respuestas[pregunta.id];
  const valor = respuesta?.value ?? "";

  if (pregunta.kind === "texto") {
    const abierta = elegida ?? nivel > 1;
    return (
      <li className="border-b border-sand py-2 last:border-b-0">
        <button
          type="button"
          aria-expanded={abierta}
          onClick={() => setElegida(!abierta)}
          className="flex min-h-12 w-full items-center gap-2 text-left text-lg text-forest"
        >
          <Flecha abierta={abierta} />
          <span>{pregunta.text}</span>
        </button>
        <RespondidaComo pregunta={pregunta} respuesta={respuesta} />
        {abierta ? (
          <div className="print:hidden">
            <textarea
              value={valor}
              rows={2}
              aria-label={pregunta.text}
              onChange={(event) => onResponder(pregunta, event.target.value)}
              className="mt-1 w-full rounded-xl border border-sand bg-white px-4 py-3 text-lg"
            />
            <div className="mt-1">
              <FechaRespuesta respuesta={respuesta} />
            </div>
          </div>
        ) : (
          <p className={`truncate pl-6 print:hidden ${valor ? "text-forest" : "text-muted"}`}>{valor || "Sin responder"}</p>
        )}
        <p className="hidden whitespace-pre-wrap pl-6 text-forest print:block">{valor || "Sin responder"}</p>
      </li>
    );
  }

  const hijas = subpreguntasVisibles(pregunta, valor);
  const hayDetalle = hijas.length > 0 || Boolean(respuesta);
  const abierta = elegida ?? hijas.length > 0;

  function marcar(opcion: "si" | "no") {
    setElegida(null);
    onResponder(pregunta, valor === opcion ? "" : opcion);
  }

  return (
    <li className="border-b border-sand py-2 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        {hayDetalle ? (
          <button
            type="button"
            aria-expanded={abierta}
            onClick={() => setElegida(!abierta)}
            className="flex min-h-12 min-w-0 items-center gap-2 text-left text-lg text-forest"
          >
            <Flecha abierta={abierta} />
            <span>{pregunta.text}</span>
          </button>
        ) : (
          <p className="flex min-h-12 min-w-0 items-center pl-6 text-lg text-forest">{pregunta.text}</p>
        )}
        <div className="ml-6 flex items-center gap-5">
          <label className="flex min-h-12 cursor-pointer items-center gap-2 text-lg text-forest">
            <input
              type="checkbox"
              className="h-6 w-6 accent-forest"
              checked={valor === "si"}
              aria-label={`${pregunta.text}: Sí`}
              onChange={() => marcar("si")}
            />
            Sí
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-2 text-lg text-forest">
            <input
              type="checkbox"
              className="h-6 w-6 accent-forest"
              checked={valor === "no"}
              aria-label={`${pregunta.text}: No`}
              onChange={() => marcar("no")}
            />
            No
          </label>
        </div>
      </div>
      <RespondidaComo pregunta={pregunta} respuesta={respuesta} />
      {hayDetalle ? (
        <div className={abierta ? "pl-6" : "hidden pl-6 print:block"}>
          <div className="print:hidden">
            <FechaRespuesta respuesta={respuesta} />
          </div>
          {hijas.length > 0 ? (
            <ul className="ml-1 mt-1 border-l border-sand pl-3 sm:ml-4 sm:pl-4">
              {hijas.map((hija) => (
                <FilaPregunta key={hija.id} pregunta={hija} nivel={nivel + 1} respuestas={respuestas} onResponder={onResponder} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AntecedentesMedicos({
  preguntas,
  respuestas,
  background,
  patientId,
  plegado = false,
  onRespuestas,
  onBackground,
}: {
  preguntas: PreguntaMedica[];
  respuestas: RespuestasMedicas;
  background: string;
  patientId: string;
  plegado?: boolean;
  onRespuestas: (respuestas: RespuestasMedicas) => void;
  onBackground: (background: string) => void;
}) {
  const resumen = resumenAntecedentes(preguntas, respuestas);
  const retiradas = respuestasRetiradas(preguntas, respuestas);

  function responder(pregunta: PreguntaMedica, valor: string) {
    const next = { ...respuestas };
    if (valor.trim()) {
      next[pregunta.id] = {
        question: pregunta.text,
        kind: pregunta.kind,
        value: valor,
        answeredOn: todayInArgentina(),
      };
    } else {
      delete next[pregunta.id];
    }
    onRespuestas(next);
  }

  const cuerpo = (
    <>
      {preguntas.length > 0 ? (
        <ul className="mt-2">
          {preguntas.map((pregunta) => (
            <FilaPregunta key={pregunta.id} pregunta={pregunta} nivel={1} respuestas={respuestas} onResponder={responder} />
          ))}
        </ul>
      ) : null}
      {retiradas.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-lg text-forest">Preguntas que ya no están en tu lista</h4>
          <ul className="mt-2 space-y-2">
            {retiradas.map((item) => (
              <li key={item.id} className="rounded-xl bg-panel px-4 py-3 text-forest">
                <p>{item.question || "Pregunta sin texto"}</p>
                <p className="whitespace-pre-wrap">{valorEnPalabras(item)}</p>
                {item.answeredOn ? <p className="text-muted">Respondida el {fechaEnPalabras(item.answeredOn)}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <label className="mt-4 block">
        Otros antecedentes
        <textarea
          value={background}
          onChange={(event) => onBackground(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-lg"
        />
      </label>
      <Link
        href={`/consultorio/preguntas?volver=${encodeURIComponent(`/consultorio/pacientes/${patientId}`)}`}
        className="mt-3 inline-flex min-h-12 items-center text-forest underline underline-offset-4 print:hidden"
      >
        Editar mis preguntas
      </Link>
    </>
  );

  if (plegado) {
    return (
      <details className="rounded-2xl border border-sand bg-white print:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="block font-serif text-2xl">Antecedentes médicos</span>
          <span className="mt-1 block text-forest">{resumen}</span>
        </summary>
        <div className="px-4 pb-4">{cuerpo}</div>
      </details>
    );
  }

  return (
    <div className="rounded-2xl border border-sand bg-white p-4">
      <h3 className="font-serif text-2xl">Antecedentes médicos</h3>
      <p className="mt-1 text-forest">{resumen}</p>
      {cuerpo}
    </div>
  );
}
