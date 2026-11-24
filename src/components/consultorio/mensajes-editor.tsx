"use client";

import { useEffect, useRef, useState } from "react";
import { saveMensajesTurno } from "@/app/consultorio/actions";
import { sumarDias } from "@/lib/consultorio/agenda-horario";
import {
  DATOS_DEL_TURNO,
  MAX_MENSAJE,
  PLANTILLAS_INICIALES,
  completarPlantilla,
  marcadoresDesconocidos,
  type MensajesTurno,
} from "@/lib/consultorio/avisos-turno";
import { BotonAtras } from "@/components/consultorio/boton-atras";

type Clave = keyof MensajesTurno;

const TARJETAS: { clave: Clave; titulo: string }[] = [
  { clave: "confirmacion", titulo: "Confirmación del turno" },
  { clave: "recordatorio", titulo: "Recordatorio" },
];

const secundario =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-forest bg-white px-5 text-forest disabled:cursor-default disabled:opacity-40";

export function MensajesEditor({ initial, volver, hoy }: { initial: MensajesTurno; volver: string; hoy: string }) {
  const [mensajes, setMensajes] = useState(initial);
  const [editando, setEditando] = useState<Clave | null>(null);
  const [recien, setRecien] = useState<Clave | null>(null);
  const ejemplo = { patientName: "Juan Pérez", dateKey: sumarDias(hoy, 1), timeLocal: "10:30", reason: "Control de ortodoncia" };

  async function guardar(clave: Clave, texto: string) {
    const siguiente = { ...mensajes, [clave]: texto };
    const result = await saveMensajesTurno(siguiente);
    if ("error" in result) throw new Error(result.error);
    setMensajes(siguiente);
    setEditando(null);
    setRecien(clave);
    window.setTimeout(() => setRecien((actual) => (actual === clave ? null : actual)), 3000);
  }

  return (
    <div>
      <BotonAtras href={volver} />
      <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Mensajes</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">Así les llegan a tus pacientes. Los datos de cada turno se completan solos.</p>

      <div className="mt-8 grid max-w-2xl gap-10">
        {TARJETAS.map(({ clave, titulo }) => (
          <section key={clave} aria-labelledby={`mensaje-${clave}`}>
            <h2 id={`mensaje-${clave}`} className="font-serif text-3xl text-forest">
              {titulo}
            </h2>
            {editando === clave ? (
              <Edicion
                id={clave}
                inicial={mensajes[clave]}
                original={PLANTILLAS_INICIALES[clave]}
                onGuardar={(texto) => guardar(clave, texto)}
                onCancelar={() => setEditando(null)}
              />
            ) : (
              <>
                <Globo texto={completarPlantilla(mensajes[clave], ejemplo, hoy)} />
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={editando !== null}
                    onClick={() => {
                      setRecien(null);
                      setEditando(clave);
                    }}
                    className={secundario}
                    aria-label={`Editar ${titulo.toLocaleLowerCase("es")}`}
                  >
                    <Lapiz />
                    Editar
                  </button>
                  <span role="status" className="text-forest">
                    {recien === clave ? "✓ Guardado" : ""}
                  </span>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** El mensaje como lo ve el paciente en WhatsApp. */
function Globo({ texto }: { texto: string }) {
  return (
    <div className="mt-3 rounded-2xl rounded-tl-sm border border-sand bg-white px-4 py-3 text-forest shadow-sm">
      <p className="whitespace-pre-wrap break-words">{conNegritas(texto)}</p>
    </div>
  );
}

function Edicion({
  id,
  inicial,
  original,
  onGuardar,
  onCancelar,
}: {
  id: string;
  inicial: string;
  original: string;
  onGuardar: (texto: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState(inicial);
  const [datos, setDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const vacio = !texto.trim();
  const desconocidos = marcadoresDesconocidos(texto);

  // Al abrir, el cursor queda al final del mensaje.
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function insertar(marcador: string) {
    const el = campo.current;
    const inicio = el ? el.selectionStart : texto.length;
    const fin = el ? el.selectionEnd : texto.length;
    const nuevo = `${texto.slice(0, inicio)}${marcador}${texto.slice(fin)}`.slice(0, MAX_MENSAJE);
    setTexto(nuevo);
    const cursor = Math.min(inicio + marcador.length, nuevo.length);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  }

  async function guardar() {
    if (vacio || guardando) return;
    setGuardando(true);
    setError("");
    try {
      await onGuardar(texto);
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="mt-3">
      <label htmlFor={`texto-${id}`} className="sr-only">
        Mensaje
      </label>
      <textarea
        id={`texto-${id}`}
        ref={campo}
        value={texto}
        maxLength={MAX_MENSAJE}
        onChange={(event) => setTexto(event.target.value)}
        className="min-h-44 w-full rounded-2xl border border-forest bg-white px-4 py-3 text-lg leading-relaxed text-forest field-sizing-content"
      />

      {vacio ? <p className="mt-2 text-[#6b2e2a]">Escribí el mensaje.</p> : null}
      {desconocidos.length > 0 ? (
        <p className="mt-2 text-[#6b2e2a]">
          {desconocidos.join(", ")} no {desconocidos.length === 1 ? "es un dato" : "son datos"} del turno; va a salir así.
        </p>
      ) : null}

      {datos ? (
        <div className="mt-3">
          <p className="text-muted" id={`datos-${id}`}>
            Lo que está entre llaves {"{ }"} se completa solo con los datos de cada turno.
          </p>
          <div role="group" aria-labelledby={`datos-${id}`} className="mt-2 flex flex-wrap gap-2">
            {DATOS_DEL_TURNO.map((dato) => (
              <button
                key={dato.marcador}
                type="button"
                onClick={() => insertar(dato.marcador)}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-sand bg-white px-4 text-forest"
              >
                + {dato.etiqueta}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDatos(true)}
          className="mt-2 min-h-11 cursor-pointer text-forest underline underline-offset-4"
        >
          + Agregar un dato del turno
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-[#6b2e2a]">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={vacio || guardando}
          onClick={guardar}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-forest px-6 text-lg text-cream disabled:cursor-default disabled:opacity-40"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando} className="min-h-11 cursor-pointer text-forest">
          Cancelar
        </button>
        {texto !== original ? (
          <button
            type="button"
            onClick={() => setTexto(original)}
            className="ml-auto min-h-11 cursor-pointer text-muted underline underline-offset-4"
          >
            Volver al mensaje original
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** WhatsApp muestra en negrita lo que va entre asteriscos. */
function conNegritas(texto: string) {
  return texto.split(/(\*[^*\n]+\*)/g).map((parte, indice) =>
    /^\*[^*\n]+\*$/.test(parte) ? <strong key={indice}>{parte.slice(1, -1)}</strong> : parte,
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
