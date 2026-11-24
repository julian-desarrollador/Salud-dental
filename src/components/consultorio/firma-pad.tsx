"use client";

import { useCallback, useRef, useState } from "react";
import { firmarConEnlace } from "@/app/consultorio/actions";
import { hojaPropiaPorWhatsapp, type TextoVigente } from "@/lib/consultorio/consents";
import { ApartadosDelTexto } from "@/components/consultorio/texto-consentimiento";
import { OdontogramaPiezasLectura } from "@/components/consultorio/odontograma-lectura";
import { toothMarks, type Firmante, type Piezas, type ToothMark } from "@/lib/consultorio/types";

const quadrants = [
  { title: "Arriba, derecha", teeth: ["18", "17", "16", "15", "14", "13", "12", "11"] },
  { title: "Arriba, izquierda", teeth: ["21", "22", "23", "24", "25", "26", "27", "28"] },
  { title: "Abajo, derecha", teeth: ["48", "47", "46", "45", "44", "43", "42", "41"] },
  { title: "Abajo, izquierda", teeth: ["31", "32", "33", "34", "35", "36", "37", "38"] },
];

const markById = Object.fromEntries(toothMarks.map((mark) => [mark.id, mark])) as Record<
  ToothMark,
  (typeof toothMarks)[number]
>;

export function OdontogramaLectura({ teeth }: { teeth: Partial<Record<string, ToothMark>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quadrants.map((quadrant) => (
        <div key={quadrant.title}>
          <p className="text-sm text-muted">{quadrant.title}</p>
          <div className="mt-2 grid grid-cols-8 gap-1">
            {quadrant.teeth.map((tooth) => {
              const mark = teeth[tooth] ?? "sana";
              return (
                <div key={tooth} className="overflow-hidden rounded border border-sand bg-white text-center text-xs text-forest">
                  <span className="block h-2 w-full" style={{ background: markById[mark].color }} />
                  <span className={`block py-1 ${mark === "ausente" ? "line-through" : ""}`}>{tooth}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export type VistaDelEnlace = {
  kind: "general" | "ortodoncia" | "ortopedia";
  name: string;
  dni: string;
  nacimiento: string;
  notas: { label: string; texto: string }[];
  piezas: Piezas;
  /** El texto vigente: el que Jesica dejó en "Consentimientos". */
  texto: TextoVigente;
};

const PROFESIONAL = "Od. Jesica Brenda Goroso";
const campo = "mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg";

/** El lienzo donde se firma con el dedo. Avisa con el canvas cuando hay firma, o null al borrarla. */
function Lienzo({ onFirma, children }: { onFirma: (canvas: HTMLCanvasElement | null) => void; children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const preparar = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1a3853";
  }, []);

  function punto(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function borrar() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    onFirma(null);
  }

  return (
    <>
      <canvas
        ref={preparar}
        aria-label="Espacio para firmar"
        className="mt-2 h-40 w-full touch-none rounded-xl border border-forest bg-white"
        onPointerDown={(event) => {
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const { x, y } = punto(event);
          context.beginPath();
          context.moveTo(x, y);
          drawing.current = true;
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          const { x, y } = punto(event);
          context.lineTo(x, y);
          context.stroke();
          onFirma(event.currentTarget);
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="inline-flex h-12 items-center rounded-full border border-forest px-5" onClick={borrar}>
          Borrar firma
        </button>
        {children}
      </div>
    </>
  );
}

export function FirmaPad({ token, view }: { token: string; view: VistaDelEnlace }) {
  const hoja = view.kind === "general" ? undefined : hojaPropiaPorWhatsapp(view.kind);
  const [firmaHecha, setFirmaHecha] = useState<HTMLCanvasElement | null>(null);
  const [firmante, setFirmante] = useState<Firmante | null>(null);
  const [aclaracion, setAclaracion] = useState(hoja ? "" : view.name);
  const [dni, setDni] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const datosListos = hoja
    ? firmante !== null && Boolean(aclaracion.trim()) && Boolean(dni.trim())
    : Boolean(aclaracion.trim());
  const listo = firmaHecha !== null && datosListos && !pending;

  function elegir(quien: Firmante) {
    setFirmante(quien);
    setAclaracion(quien === "paciente" ? view.name : "");
    setDni(quien === "paciente" ? view.dni : "");
  }

  async function save() {
    if (!listo) return;
    setPending(true);
    setError("");
    const canvas = firmaHecha;
    const imagen = canvas ? await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")) : null;
    if (!imagen) {
      setPending(false);
      setError("No se pudo leer la firma.");
      return;
    }
    const data = new FormData();
    data.set("token", token);
    data.set("kind", view.kind);
    data.set("aclaracion", aclaracion.trim());
    data.set("textVersion", view.texto.version);
    if (firmante) data.set("firmante", firmante);
    if (dni.trim()) data.set("dniFirmante", dni.trim());
    data.set("scan", new File([imagen], "firma.png", { type: "image/png" }));
    try {
      const result = await firmarConEnlace(data);
      if ("error" in result) {
        setError(result.error);
        setPending(false);
        return;
      }
      setDone(true);
    } catch {
      setError("No se pudo guardar la firma. Probá de nuevo.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-3xl rounded-[22px] border border-sand bg-white p-5 text-forest">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
        <h2 className="mt-2 font-serif text-4xl">La firma quedó hecha</h2>
        <p className="mt-4 text-lg">Ya podés cerrar esta página.</p>
      </div>
    );
  }

  const firma = (
    <>
      <p className="mt-6">Firma</p>
      <Lienzo onFirma={setFirmaHecha}>
        <button
          type="button"
          disabled={!listo}
          onClick={() => void save()}
          className="inline-flex h-12 items-center rounded-full bg-forest px-5 text-cream disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar firma"}
        </button>
      </Lienzo>
      {error ? <p className="mt-3 text-[#6b2e2a]">{error}</p> : null}
    </>
  );

  if (!hoja) {
    return (
      <div className="mx-auto max-w-3xl rounded-[22px] border border-sand bg-white p-5 text-forest">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{view.texto.titulo}</h1>
        <ApartadosDelTexto texto={view.texto} />
        <h3 className="mt-8 font-serif text-2xl">Odontograma</h3>
        <div className="mt-3">
          <OdontogramaPiezasLectura piezas={view.piezas} />
        </div>
        <label className="mt-8 block" htmlFor="aclaracion">
          Aclaración
        </label>
        <input id="aclaracion" value={aclaracion} onChange={(event) => setAclaracion(event.target.value)} className={campo} />
        {firma}
      </div>
    );
  }

  const opcion = (quien: Firmante, texto: string) => (
    <button
      type="button"
      aria-pressed={firmante === quien}
      onClick={() => elegir(quien)}
      className={`min-h-14 w-full rounded-2xl border border-forest px-4 py-3 text-left text-lg ${
        firmante === quien ? "bg-forest text-cream" : "bg-white text-forest"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl rounded-[22px] border border-sand bg-white p-5 text-forest">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
      <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{view.texto.titulo}</h1>
      <dl className="mt-6 grid gap-3 text-base sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-muted">Paciente</dt>
          <dd className="text-lg">{view.name}</dd>
        </div>
        {view.dni ? (
          <div>
            <dt className="text-muted">DNI</dt>
            <dd>{view.dni}</dd>
          </div>
        ) : null}
        {view.nacimiento ? (
          <div>
            <dt className="text-muted">Fecha de nacimiento</dt>
            <dd>{view.nacimiento}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-muted">Profesional</dt>
          <dd>{PROFESIONAL}</dd>
        </div>
      </dl>

      <ApartadosDelTexto texto={view.texto} />

      {view.notas.map((nota) => (
        <div key={nota.label} className="mt-6 rounded-xl border border-sand bg-cream px-4 py-3">
          <p className="font-semibold">{nota.label}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{nota.texto}</p>
        </div>
      ))}

      <fieldset className="mt-8">
        <legend className="font-serif text-2xl">¿Quién firma?</legend>
        <div className="mt-3 grid gap-3">
          {opcion("paciente", "Soy el paciente")}
          {opcion("representante", "Soy la madre, el padre o el representante legal")}
        </div>
      </fieldset>

      {firmante ? (
        <>
          <label className="mt-6 block" htmlFor="aclaracion">
            Nombre y apellido
          </label>
          <input
            id="aclaracion"
            value={aclaracion}
            autoComplete="name"
            onChange={(event) => setAclaracion(event.target.value)}
            className={campo}
          />
          <label className="mt-4 block" htmlFor="dni">
            DNI
          </label>
          <input id="dni" value={dni} inputMode="numeric" onChange={(event) => setDni(event.target.value)} className={campo} />
          {firma}
        </>
      ) : null}
    </div>
  );
}
