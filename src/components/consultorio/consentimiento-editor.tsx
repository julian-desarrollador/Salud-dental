"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveConsentimientoTexto } from "@/app/consultorio/actions";
import { BotonAtras } from "@/components/consultorio/boton-atras";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { PrintButton } from "@/components/consultorio/print-button";
import {
  LIMITES_TEXTO,
  mismoTexto,
  sanitizeTexto,
  type HojaEditable,
  type TextoConsentimiento,
} from "@/lib/consultorio/consents";

const campo = "mt-1 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest";

/**
 * La hoja de un consentimiento con su barra (Atrás, Editar, Imprimir).
 * "Editar" cambia la hoja por el editor del título y los apartados.
 */
export function ConsentimientoEditor({
  kind,
  nombre,
  texto,
  original,
  volver,
  editable,
  children,
}: {
  kind: HojaEditable;
  nombre: string;
  texto: TextoConsentimiento;
  original: TextoConsentimiento;
  volver: string;
  /** La hoja en blanco se edita; la hoja firmada de un paciente, no. */
  editable: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  return (
    <>
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <BotonAtras href={volver} />
        {editando ? null : (
          <div className="flex flex-wrap items-center gap-3">
            {guardado ? (
              <span role="status" className="text-forest">
                ✓ Guardado
              </span>
            ) : null}
            {editable ? (
              <button
                type="button"
                onClick={() => {
                  setGuardado(false);
                  setEditando(true);
                }}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-forest bg-white px-5 text-lg text-forest"
              >
                <Lapiz />
                Editar
              </button>
            ) : null}
            <PrintButton />
          </div>
        )}
      </div>
      {editando ? (
        <Edicion
          kind={kind}
          nombre={nombre}
          inicial={texto}
          original={original}
          onCancelar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            setGuardado(true);
            router.refresh();
          }}
        />
      ) : (
        children
      )}
    </>
  );
}

function Edicion({
  kind,
  nombre,
  inicial,
  original,
  onCancelar,
  onGuardado,
}: {
  kind: HojaEditable;
  nombre: string;
  inicial: TextoConsentimiento;
  original: TextoConsentimiento;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [borrador, setBorrador] = useState<TextoConsentimiento>(inicial);
  const [quitar, setQuitar] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState<number | null>(null);
  const titulo = useRef<HTMLInputElement>(null);
  const conApartados = kind !== "general";
  const valido = sanitizeTexto(borrador) !== null;

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function cambiarApartado(index: number, cambios: Partial<TextoConsentimiento["apartados"][number]>) {
    setBorrador((actual) => ({
      ...actual,
      apartados: actual.apartados.map((apartado, i) => (i === index ? { ...apartado, ...cambios } : apartado)),
    }));
  }

  async function guardar() {
    if (!valido || guardando) return;
    setGuardando(true);
    setError("");
    try {
      const result = await saveConsentimientoTexto(kind, borrador);
      if ("error" in result) {
        setError(result.error);
        setGuardando(false);
        return;
      }
      onGuardado();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl text-forest">Editar: {nombre}</h1>
      <p className="mt-3 text-muted">Los pacientes que ya firmaron conservan el texto que firmaron.</p>

      <label className="mt-6 block text-forest" htmlFor="titulo-hoja">
        Título
      </label>
      <input
        id="titulo-hoja"
        ref={titulo}
        value={borrador.titulo}
        maxLength={LIMITES_TEXTO.titulo}
        onChange={(event) => setBorrador((actual) => ({ ...actual, titulo: event.target.value }))}
        className={`${campo} min-h-12`}
      />

      <p className="mt-6 text-muted">Para empezar otro párrafo, dejá una línea en blanco.</p>
      <div className="mt-3 grid gap-4">
        {borrador.apartados.map((apartado, index) => (
          <section key={index} aria-label={conApartados ? `Apartado ${index + 1}` : "Texto"} className="rounded-2xl border border-sand bg-white p-4">
            {conApartados ? (
              <label className="block text-forest">
                Apartado {index + 1}
                <input
                  value={apartado.titulo}
                  maxLength={LIMITES_TEXTO.tituloApartado}
                  autoFocus={nuevo === index}
                  onChange={(event) => cambiarApartado(index, { titulo: event.target.value })}
                  placeholder="Título del apartado"
                  className={`${campo} min-h-12`}
                />
              </label>
            ) : null}
            <label className={`block text-forest ${conApartados ? "mt-3" : ""}`}>
              {conApartados ? "Texto" : "Texto del consentimiento"}
              <textarea
                value={apartado.texto}
                maxLength={LIMITES_TEXTO.texto}
                onChange={(event) => cambiarApartado(index, { texto: event.target.value })}
                className={`${campo} min-h-32 py-3 leading-relaxed field-sizing-content`}
              />
            </label>
            {conApartados && borrador.apartados.length > 1 ? (
              <button type="button" onClick={() => setQuitar(index)} className="mt-2 min-h-11 cursor-pointer text-[#6b2e2a]">
                Quitar apartado
              </button>
            ) : null}
          </section>
        ))}
      </div>
      {conApartados && borrador.apartados.length < LIMITES_TEXTO.apartados ? (
        <button
          type="button"
          onClick={() => {
            setNuevo(borrador.apartados.length);
            setBorrador((actual) => ({ ...actual, apartados: [...actual.apartados, { titulo: "", texto: "" }] }));
          }}
          className="mt-4 inline-flex min-h-12 cursor-pointer items-center rounded-full border border-forest bg-white px-5 text-lg text-forest"
        >
          + Agregar apartado
        </button>
      ) : null}

      {!valido ? <p className="mt-4 text-[#6b2e2a]">Falta el título o el texto.</p> : null}
      {error ? (
        <p role="alert" className="mt-4 text-[#6b2e2a]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 pb-6">
        <button
          type="button"
          disabled={!valido || guardando}
          onClick={() => void guardar()}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-forest px-6 text-lg text-cream disabled:cursor-default disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando} className="min-h-11 cursor-pointer text-forest">
          Cancelar
        </button>
        {!mismoTexto(borrador, original) ? (
          <button
            type="button"
            onClick={() => setBorrador(original)}
            className="ml-auto min-h-11 cursor-pointer text-muted underline underline-offset-4"
          >
            Volver al texto original
          </button>
        ) : null}
      </div>

      {quitar !== null ? (
        <Confirmacion
          title="¿Quitar este apartado?"
          text={borrador.apartados[quitar]?.titulo || "Se borra su texto."}
          confirm="Sí, quitar"
          onConfirm={() => {
            setBorrador((actual) => ({ ...actual, apartados: actual.apartados.filter((_, i) => i !== quitar) }));
            setQuitar(null);
          }}
          onClose={() => setQuitar(null)}
        />
      ) : null}
    </div>
  );
}

function Lapiz() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path strokeLinecap="round" d="m13.5 6.5 4 4" />
    </svg>
  );
}
