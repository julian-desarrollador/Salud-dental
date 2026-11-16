"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveCatalogoOdontograma } from "@/app/consultorio/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { MAX_ABREVIATURA, abreviatura, mover, sanitizeCatalogo } from "@/lib/consultorio/odontograma";
import type { PrestacionCatalogo } from "@/lib/consultorio/types";

const accion =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-4 text-base text-forest disabled:cursor-default disabled:opacity-40";

function problemaDe(items: PrestacionCatalogo[]) {
  try {
    sanitizeCatalogo(items);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Revisá la lista de prestaciones.";
  }
}

export function CatalogoEditor({ initial, volver }: { initial: PrestacionCatalogo[]; volver: string }) {
  const [items, setItems] = useState(initial);
  const [nuevoId, setNuevoId] = useState<string | null>(null);
  const [aQuitar, setAQuitar] = useState<PrestacionCatalogo | null>(null);
  const [guardado, setGuardado] = useState(() => JSON.stringify(initial));
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
        const result = await saveCatalogoOdontograma(items);
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

  function editar(id: string, cambios: Partial<PrestacionCatalogo>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  return (
    <div>
      <Link href={volver} className="inline-flex h-11 items-center justify-center rounded-2xl border border-sand bg-white px-4 text-forest">
        Atrás
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Prestaciones del odontograma</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">
        Son las prestaciones que podés marcar en cada diente. Si cambiás o quitás una, lo que ya está cargado en las fichas no cambia.
      </p>
      {notice ? (
        <p className="fixed inset-x-0 bottom-20 z-30 bg-sand py-3 text-center text-forest md:bottom-0" role="status">
          {notice}
        </p>
      ) : null}

      {items.length === 0 ? <p className="mt-8 text-forest">Todavía no hay prestaciones.</p> : null}
      <ul className="mt-8 space-y-4">
        {items.map((item, indice) => (
          <li key={item.id} className="rounded-2xl border border-sand bg-white p-4">
            <label className="block">
              Nombre
              <input
                value={item.name}
                maxLength={60}
                autoFocus={item.id === nuevoId}
                onChange={(event) => editar(item.id, { name: event.target.value })}
                className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
              />
            </label>
            <label className="mt-3 block">
              Abreviatura para el dibujo (hasta {MAX_ABREVIATURA} letras)
              <input
                value={item.short}
                maxLength={MAX_ABREVIATURA}
                placeholder={abreviatura(item.name)}
                onChange={(event) => editar(item.id, { short: event.target.value })}
                className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={accion} disabled={indice === 0} onClick={() => setItems((current) => mover(current, item.id, -1))}>
                Subir
              </button>
              <button
                type="button"
                className={accion}
                disabled={indice === items.length - 1}
                onClick={() => setItems((current) => mover(current, item.id, 1))}
              >
                Bajar
              </button>
              <button type="button" className={accion} onClick={() => setAQuitar(item)}>
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={items.length >= 100}
        onClick={() => {
          const nuevo: PrestacionCatalogo = { id: crypto.randomUUID(), name: "", short: "" };
          setNuevoId(nuevo.id);
          setItems((current) => [...current, nuevo]);
        }}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40"
      >
        Agregar prestación
      </button>

      {aQuitar ? (
        <Confirmacion
          title="¿Quitar esta prestación?"
          text={`${aQuitar.name || "La prestación en blanco"} sale de tu lista. Las fichas que ya la tienen la conservan.`}
          confirm="Quitar"
          onConfirm={() => {
            setItems((current) => current.filter((item) => item.id !== aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </div>
  );
}
