"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { savePrecios } from "@/app/consultorio/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { parsePesos, pesos } from "@/lib/consultorio/money";
import { MAX_NOMBRE_PRESTACION, MAX_TIPO, ordenarPrecios, sanitizePrecios } from "@/lib/consultorio/presupuesto";
import type { FeeItem } from "@/lib/consultorio/types";

const celda = "min-h-12 w-full rounded-xl border border-sand bg-white px-3 text-lg";
const accion =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-3 text-base text-forest disabled:cursor-default disabled:opacity-40";
/** Con pocas prestaciones no hace falta buscar. */
const BUSCADOR_DESDE = 9;

function problemaDe(items: FeeItem[]) {
  try {
    sanitizePrecios(items);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Revisá la lista de precios.";
  }
}

/** Campo de precio: se escribe libre y al salir se guarda y se muestra con puntos. */
export function CampoPrecio({
  value,
  onChange,
  etiqueta,
  placeholder = "a confirmar",
  className = "",
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  etiqueta: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    // El contorno de foco va en el recuadro entero (con el "$"), igual que en los otros campos.
    <span
      className={`flex min-h-12 items-center rounded-xl border border-sand bg-white px-3 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-forest ${className}`}
    >
      <span aria-hidden="true" className="text-muted">
        $
      </span>
      <input
        key={`precio-${value ?? "vacio"}`}
        defaultValue={pesos(value)}
        inputMode="numeric"
        aria-label={etiqueta}
        placeholder={placeholder}
        onBlur={(event) => {
          const texto = event.target.value;
          const next = parsePesos(texto);
          if (texto.trim() && next === null) {
            event.target.value = pesos(value);
            return;
          }
          event.target.value = pesos(next);
          if (next !== value) onChange(next);
        }}
        className="min-h-11 w-full min-w-0 bg-transparent px-1 text-right text-lg placeholder:text-sm focus-visible:outline-none!"
      />
    </span>
  );
}

export function PreciosPlanilla({ initial, volver }: { initial: FeeItem[]; volver: string }) {
  // Al entrar se ordena por categoría y nombre. Las filas nuevas quedan al final hasta la próxima vez.
  const [items, setItems] = useState(() => ordenarPrecios(initial));
  const [query, setQuery] = useState("");
  const [nuevoId, setNuevoId] = useState<string | null>(null);
  const [aQuitar, setAQuitar] = useState<FeeItem | null>(null);
  // Reordenar al entrar no cuenta como cambio: ese orden se guarda con la próxima edición.
  const [guardado, setGuardado] = useState(() => JSON.stringify(ordenarPrecios(initial)));
  const [huboGuardado, setHuboGuardado] = useState(false);
  const [falloEn, setFalloEn] = useState<string | null>(null);

  const draft = JSON.stringify(items);
  const problema = problemaDe(items);
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
        const result = await savePrecios(items);
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
  }, [draft, guardado, items, problema]);

  const categorias = useMemo(
    () => Array.from(new Set(items.map((item) => item.chapter.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [items],
  );
  const conBuscador = items.length >= BUSCADOR_DESDE;
  const texto = conBuscador ? query.trim().toLocaleLowerCase("es") : "";
  const visibles = texto
    ? items.filter((item) => `${item.name} ${item.chapter}`.toLocaleLowerCase("es").includes(texto))
    : items;

  function editar(id: string, cambios: Partial<FeeItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function agregar() {
    const ultimaCategoria = items.at(-1)?.chapter ?? "";
    const nuevo: FeeItem = { id: crypto.randomUUID(), chapter: ultimaCategoria, name: "", price: null };
    setQuery("");
    setNuevoId(nuevo.id);
    setItems((current) => [...current, nuevo]);
  }

  function quitar(item: FeeItem) {
    if (item.name.trim()) setAQuitar(item);
    else setItems((current) => current.filter((fila) => fila.id !== item.id));
  }

  return (
    <section>
      <Link href={volver} className="inline-flex h-11 items-center justify-center rounded-2xl border border-sand bg-white px-4 text-forest">
        Atrás
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Mis precios</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">
        Tu lista para armar presupuestos: escribí la categoría, la prestación y el precio. Se guarda sola y no se publica en la página.
      </p>
      {notice ? (
        <p className="fixed inset-x-0 bottom-20 z-30 bg-sand py-3 text-center text-forest md:bottom-0" role="status">
          {notice}
        </p>
      ) : null}

      {conBuscador ? (
        <div className="mt-6">
          <label className="block text-forest" htmlFor="buscar-precio">
            Buscar en mis precios
          </label>
          <input
            id="buscar-precio"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Prestación o categoría"
            className={`mt-2 ${celda}`}
          />
          <p className="mt-2 text-muted">
            {texto ? `${visibles.length} de ${items.length}` : `${items.length} prestaciones`}
          </p>
        </div>
      ) : null}

      <datalist id="categorias-precios">
        {categorias.map((categoria) => (
          <option key={categoria} value={categoria} />
        ))}
      </datalist>

      <div role="table" aria-label="Mis precios" className="mt-6">
        <div role="row" className="hidden gap-2 px-1 pb-2 text-muted md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_10rem_auto]">
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Prestación</span>
          <span role="columnheader" className="text-right">
            Precio
          </span>
          <span role="columnheader" className="sr-only">
            Quitar
          </span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand p-4 text-forest">
            Todavía no cargaste precios. Tocá “Agregar prestación” para empezar.
          </p>
        ) : null}
        {texto && visibles.length === 0 ? <p className="text-forest">No hay prestaciones con ese texto.</p> : null}
        <div className="space-y-3 md:space-y-2">
          {visibles.map((item) => {
            const indice = items.findIndex((fila) => fila.id === item.id);
            return (
              <div
                key={item.id}
                role="row"
                className="grid gap-2 rounded-2xl border border-sand bg-white p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_10rem_auto] md:items-center md:rounded-xl md:border-0 md:bg-transparent md:p-0"
              >
                <label role="cell" className="block">
                  <span className="text-muted md:sr-only">Categoría</span>
                  <input
                    value={item.chapter}
                    list="categorias-precios"
                    maxLength={MAX_TIPO}
                    autoFocus={item.id === nuevoId}
                    placeholder="Por ejemplo, Ortodoncia"
                    aria-label={`Categoría de la fila ${indice + 1}`}
                    onChange={(event) => editar(item.id, { chapter: event.target.value })}
                    className={`mt-1 md:mt-0 ${celda}`}
                  />
                </label>
                <label role="cell" className="block">
                  <span className="text-muted md:sr-only">Prestación</span>
                  <input
                    value={item.name}
                    maxLength={MAX_NOMBRE_PRESTACION}
                    placeholder="Por ejemplo, Brackets metálicos"
                    aria-label={`Prestación de la fila ${indice + 1}`}
                    onChange={(event) => editar(item.id, { name: event.target.value })}
                    className={`mt-1 md:mt-0 ${celda}`}
                  />
                </label>
                <div role="cell">
                  <span className="text-muted md:sr-only">Precio</span>
                  <CampoPrecio
                    value={item.price}
                    etiqueta={`Precio de la fila ${indice + 1}`}
                    placeholder="Sin precio"
                    onChange={(price) => editar(item.id, { price })}
                    className="mt-1 md:mt-0"
                  />
                </div>
                <div role="cell" className="flex justify-end">
                  <button type="button" className={accion} onClick={() => quitar(item)}>
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={agregar}
        disabled={items.length >= 500}
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40"
      >
        Agregar prestación
      </button>

      {aQuitar ? (
        <Confirmacion
          title="¿Quitar esta prestación?"
          text={`${aQuitar.name} sale de tu lista de precios. Los presupuestos ya armados no cambian.`}
          confirm="Quitar"
          onConfirm={() => {
            setItems((current) => current.filter((item) => item.id !== aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </section>
  );
}
