"use client";

import { useEffect, useRef, useState } from "react";
import { firmarConEnlace } from "@/app/consultorio/actions";
import { generalConsent } from "@/lib/consultorio/consents";
import { toothMarks, type ToothMark } from "@/lib/consultorio/types";

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

export function FirmaPad({
  name,
  teeth,
  token,
}: {
  name: string;
  teeth: Partial<Record<string, ToothMark>>;
  token: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [aclaracion, setAclaracion] = useState(name);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
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

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    drawing.current = true;
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
    setHasStroke(true);
  }

  function stop() {
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    setHasStroke(false);
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke || !aclaracion.trim() || pending) return;
    setPending(true);
    setError("");
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setPending(false);
      setError("No se pudo leer la firma.");
      return;
    }
    const data = new FormData();
    data.set("token", token);
    data.set("aclaracion", aclaracion.trim());
    data.set("textVersion", generalConsent.version);
    data.set("scan", new File([blob], "firma.png", { type: "image/png" }));
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

  return (
    <div className="mx-auto max-w-3xl rounded-[22px] border border-sand bg-white p-5 text-forest">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
        <h2 className="mt-2 font-serif text-4xl">{generalConsent.title}</h2>
        <div className="mt-6 space-y-4 text-base leading-6">
          {generalConsent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <h3 className="mt-8 font-serif text-2xl">Odontograma</h3>
        <div className="mt-3">
          <OdontogramaLectura teeth={teeth} />
        </div>
        <label className="mt-8 block" htmlFor="aclaracion">
          Aclaración
        </label>
        <input
          id="aclaracion"
          value={aclaracion}
          onChange={(event) => setAclaracion(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
        />
        <p className="mt-6">Firma del paciente</p>
        <canvas
          ref={canvasRef}
          className="mt-2 h-40 w-full touch-none rounded-xl border border-forest bg-white"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
        {error ? <p className="mt-3 text-[#6b2e2a]">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="inline-flex h-12 items-center rounded-full border border-forest px-5" onClick={clearCanvas}>
            Borrar firma
          </button>
          <button
            type="button"
            disabled={!hasStroke || !aclaracion.trim() || pending}
            onClick={() => void save()}
            className="inline-flex h-12 items-center rounded-full bg-forest px-5 text-cream disabled:opacity-40"
          >
            {pending ? "Guardando…" : "Guardar firma"}
          </button>
        </div>
    </div>
  );
}
