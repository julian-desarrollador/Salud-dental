"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { grillaDelMes, letrasSemana, tituloMes } from "@/lib/consultorio/agenda-horario";
import { fechaEnPalabras, isIsoDate, todayInArgentina } from "@/lib/consultorio/fecha";

const primerAnio = 1920;

export function CalendarioCampo({
  id,
  value,
  onChange,
  className = "",
  nacimiento = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  nacimiento?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const inicio = isIsoDate(value) ? value : todayInArgentina();
  const [year, setYear] = useState(Number(inicio.slice(0, 4)));
  const [month, setMonth] = useState(Number(inicio.slice(5, 7)));
  const [eligiendoAnio, setEligiendoAnio] = useState(false);
  const anioActual = Number(todayInArgentina().slice(0, 4));
  const anios = Array.from({ length: anioActual - primerAnio + 1 }, (_, index) => anioActual - index);

  useEffect(() => {
    if (!abierto) return;
    const base = isIsoDate(value) ? value : todayInArgentina();
    setYear(Number(base.slice(0, 4)));
    setMonth(Number(base.slice(5, 7)));
    setEligiendoAnio(nacimiento);
  }, [abierto, nacimiento, value]);

  useEffect(() => {
    if (!abierto) return;
    const y = window.scrollY;
    const body = document.body;
    const previo = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = previo.overflow;
      body.style.position = previo.position;
      body.style.top = previo.top;
      body.style.left = previo.left;
      body.style.right = previo.right;
      body.style.width = previo.width;
      window.scrollTo({ top: y, behavior: "instant" });
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  function mesAnterior() {
    if (month === 1) {
      setMonth(12);
      setYear((current) => current - 1);
      return;
    }
    setMonth((current) => current - 1);
  }

  function mesSiguiente() {
    if (month === 12) {
      setMonth(1);
      setYear((current) => current + 1);
      return;
    }
    setMonth((current) => current + 1);
  }

  const grilla = grillaDelMes(year, month);

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => {
          setEligiendoAnio(nacimiento);
          setAbierto(true);
        }}
        className={`flex min-h-12 w-full items-center rounded-xl border border-sand bg-white px-4 text-left text-lg ${className}`}
      >
        {isIsoDate(value) ? <span className="text-forest">{fechaEnPalabras(value)}</span> : <span className="text-muted">Elegí el día</span>}
      </button>
      {abierto
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 px-4" onClick={() => setAbierto(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendario-mes"
            className="w-full max-w-lg rounded-[22px] border border-sand bg-white p-4 lg:max-w-2xl lg:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            {eligiendoAnio ? (
              <div className="max-h-[70vh] overflow-y-auto">
                <p id="calendario-mes" className="mb-3 text-center font-semibold text-forest">
                  Elegí el año
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {anios.map((anio) => (
                    <button
                      key={anio}
                      type="button"
                      onClick={() => {
                        setYear(anio);
                        setEligiendoAnio(false);
                      }}
                      className={`h-12 rounded-xl border text-lg font-semibold ${anio === year ? "border-forest bg-forest text-cream" : "border-[#e5e5e5] bg-white text-forest"}`}
                    >
                      {anio}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
            <div className="relative mb-3 flex items-center justify-center px-12">
              <button
                type="button"
                onClick={mesAnterior}
                aria-label="Mes anterior"
                className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-xl text-forest"
              >
                <Chevron direction="left" />
              </button>
              {nacimiento ? (
                <button
                  id="calendario-mes"
                  type="button"
                  onClick={() => setEligiendoAnio(true)}
                  className="text-center font-semibold text-forest"
                >
                  {tituloMes(year, month)}
                </button>
              ) : (
                <p id="calendario-mes" className="text-center font-semibold text-forest">
                  {tituloMes(year, month)}
                </p>
              )}
              <button
                type="button"
                onClick={mesSiguiente}
                aria-label="Mes siguiente"
                className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-xl text-forest"
              >
                <Chevron direction="right" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-semibold tracking-wide text-muted">
              {letrasSemana.map((letra) => (
                <div key={letra} className="py-2">
                  {letra}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center">
              {grilla.map((cell) => {
                const selected = cell.dateKey === value;
                return (
                  <button
                    key={`${cell.dateKey}-${cell.inMonth}`}
                    type="button"
                    onClick={() => {
                      onChange(cell.dateKey);
                      setAbierto(false);
                    }}
                    className="flex flex-col items-center py-1"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold lg:h-11 lg:w-11 ${selected ? "border-forest bg-forest text-cream" : cell.inMonth ? "border-[#e5e5e5] bg-white text-forest" : "border-transparent text-muted"}`}
                    >
                      {cell.day}
                    </span>
                  </button>
                );
              })}
            </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
