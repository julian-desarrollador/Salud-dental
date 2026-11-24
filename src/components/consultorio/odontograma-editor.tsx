"use client";

import Link from "next/link";
import { useState } from "react";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import {
  ContenidoPieza,
  LeyendaOdontograma,
  ListaPiezas,
  colorEstado,
  describirPieza,
} from "@/components/consultorio/odontograma-lectura";
import { fechaEnPalabras, todayInArgentina } from "@/lib/consultorio/fecha";
import { abreviatura, bordesDelMedio, cuadrantes } from "@/lib/consultorio/odontograma";
import type { EstadoPrestacion, Piezas, PrestacionCatalogo, PrestacionPieza } from "@/lib/consultorio/types";

const MAX_POR_PIEZA = 20;

type Modo = "pendiente" | "realizada";

function Segmento({
  opciones,
  valor,
  onElegir,
  etiqueta,
}: {
  opciones: { id: string; label: string; color: string }[];
  valor: string;
  onElegir: (id: string) => void;
  etiqueta: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const activa = valor === opcion.id;
        return (
          <button
            key={opcion.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onElegir(opcion.id)}
            className="min-h-11 rounded-full border-2 px-4 text-base"
            style={
              activa
                ? { background: opcion.color, borderColor: opcion.color, color: "#ffffff" }
                : { borderColor: opcion.color, color: opcion.color, background: "#ffffff" }
            }
          >
            {opcion.label}
          </button>
        );
      })}
    </div>
  );
}

const opcionesEstado = [
  { id: "pendiente", label: "A realizar", color: colorEstado.pendiente },
  { id: "realizada", label: "Realizada", color: colorEstado.realizada },
];

export function OdontogramaEditor({
  piezas,
  catalogo,
  patientId,
  onChange,
}: {
  piezas: Piezas;
  catalogo: PrestacionCatalogo[];
  patientId: string;
  onChange: (piezas: Piezas) => void;
}) {
  const [elegida, setElegida] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("pendiente");
  const [aQuitar, setAQuitar] = useState<PrestacionPieza | null>(null);

  const lista = elegida ? (piezas[elegida] ?? []) : [];
  const hayLegado = Object.values(piezas).some((items) => (items ?? []).some((item) => item.estado === ""));

  function cambiarLista(pieza: string, cambio: (actual: PrestacionPieza[]) => PrestacionPieza[]) {
    const nueva = cambio(piezas[pieza] ?? []);
    const next = { ...piezas };
    if (nueva.length > 0) next[pieza] = nueva;
    else delete next[pieza];
    onChange(next);
  }

  function agregar(prestacion: PrestacionCatalogo) {
    if (!elegida) return;
    cambiarLista(elegida, (actual) => [
      ...actual,
      {
        id: crypto.randomUUID(),
        prestacionId: prestacion.id,
        name: prestacion.name,
        short: abreviatura(prestacion.name, prestacion.short),
        estado: modo,
        nota: "",
        addedOn: todayInArgentina(),
        doneOn: "",
      },
    ]);
  }

  function editar(id: string, cambios: Partial<PrestacionPieza>) {
    if (!elegida) return;
    cambiarLista(elegida, (actual) => actual.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function cambiarEstado(item: PrestacionPieza, estado: EstadoPrestacion) {
    if (item.estado === estado) return;
    editar(item.id, { estado, doneOn: estado === "realizada" ? todayInArgentina() : "" });
  }

  return (
    <div>
      <div className="[print-color-adjust:exact]">
        <div className="grid gap-6 md:grid-cols-2 md:gap-0">
          {cuadrantes.map((cuadrante) => (
            <div key={cuadrante.title} className={`@container border-sand ${bordesDelMedio(cuadrante, "md")}`}>
              <h3 className="font-serif text-2xl">{cuadrante.title}</h3>
              <div
                className={`mt-3 grid grid-cols-4 gap-2 @lg:grid-cols-8 ${cuadrante.lado === "derecha" ? "[direction:rtl]" : ""}`}
              >
                {cuadrante.teeth.map((pieza) => (
                  <button
                    key={pieza}
                    type="button"
                    onClick={() => {
                      setElegida(pieza);
                      document.getElementById("marcas-pieza")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    aria-pressed={elegida === pieza}
                    aria-label={describirPieza(pieza, piezas[pieza])}
                    className={`flex min-h-16 min-w-0 flex-col overflow-hidden rounded-lg border bg-cream text-lg text-forest [direction:ltr] ${elegida === pieza ? "border-forest ring-2 ring-forest" : "border-sand"}`}
                  >
                    <ContenidoPieza pieza={pieza} lista={piezas[pieza]} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <LeyendaOdontograma conSinIndicar={hayLegado} />
        </div>
      </div>

      <div id="marcas-pieza" className="mt-6 scroll-mt-4 print:hidden">
        {!elegida ? (
          <p className="text-forest">Tocá una pieza para ver o agregar prestaciones.</p>
        ) : (
          <div className="rounded-2xl border border-sand bg-white p-4">
            <h3 className="font-serif text-2xl">Pieza {elegida}</h3>
            {lista.length === 0 ? <p className="mt-2 text-muted">Sin prestaciones.</p> : null}
            <ul className="mt-3 space-y-3">
              {lista.map((item) => (
                <li key={item.id} className="rounded-xl border border-sand p-3">
                  <p className="text-lg font-semibold" style={{ color: colorEstado[item.estado] }}>
                    {item.estado === "realizada" ? "✓ " : ""}
                    {item.name}
                  </p>
                  {item.estado === "" ? (
                    <p className="text-muted">Venía del odontograma anterior. Indicá si está a realizar o realizada.</p>
                  ) : null}
                  <div className="mt-2">
                    <Segmento
                      etiqueta={`Estado de ${item.name}`}
                      opciones={opcionesEstado}
                      valor={item.estado}
                      onElegir={(estado) => cambiarEstado(item, estado as EstadoPrestacion)}
                    />
                  </div>
                  <label className="mt-3 block">
                    Nota
                    <input
                      value={item.nota}
                      maxLength={300}
                      placeholder="Por ejemplo, cara oclusal"
                      onChange={(event) => editar(item.id, { nota: event.target.value })}
                      className="mt-1 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted">
                      {item.addedOn ? `Agregada el ${fechaEnPalabras(item.addedOn)}` : ""}
                      {item.addedOn && item.estado === "realizada" && item.doneOn ? " · " : ""}
                      {item.estado === "realizada" && item.doneOn ? `Realizada el ${fechaEnPalabras(item.doneOn)}` : ""}
                    </p>
                    <button type="button" className="inline-flex min-h-11 items-center text-[#6b2e2a]" onClick={() => setAQuitar(item)}>
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <h4 className="mt-6 text-lg font-semibold text-forest">Agregar prestación</h4>
            {lista.length >= MAX_POR_PIEZA ? (
              <p className="mt-2 text-muted">Esta pieza ya tiene {MAX_POR_PIEZA} prestaciones.</p>
            ) : catalogo.length === 0 ? (
              <p className="mt-2 text-muted">Tu lista de prestaciones está vacía.</p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-forest">Agregar como:</span>
                  <Segmento
                    etiqueta="Agregar como"
                    opciones={[opcionesEstado[0], { ...opcionesEstado[1], label: "Ya realizada" }]}
                    valor={modo}
                    onElegir={(valor) => setModo(valor as Modo)}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {catalogo.map((prestacion) => (
                    <button
                      key={prestacion.id}
                      type="button"
                      onClick={() => agregar(prestacion)}
                      className="min-h-12 rounded-xl border border-sand bg-white px-3 text-left text-base text-forest"
                    >
                      {prestacion.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            <Link
              href={`/consultorio/odontograma?volver=${encodeURIComponent(`/consultorio/pacientes/${patientId}?tab=odontograma`)}`}
              className="mt-4 inline-flex min-h-12 items-center text-forest underline underline-offset-4"
            >
              Editar la lista de prestaciones
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 hidden print:block">
        <ListaPiezas piezas={piezas} />
      </div>

      {aQuitar && elegida ? (
        <Confirmacion
          title="¿Quitar esta prestación?"
          text={`${aQuitar.name} sale de la pieza ${elegida}.`}
          confirm="Quitar"
          onConfirm={() => {
            cambiarLista(elegida, (actual) => actual.filter((item) => item.id !== aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </div>
  );
}
