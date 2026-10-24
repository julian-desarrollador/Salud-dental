"use client";

import { useMemo, useState } from "react";
import { saveOneFee } from "@/app/consultorio/actions";
import { collegeFeeDate, collegeHour, parsePesos, pesos } from "@/lib/consultorio/money";
import type { FeeItem } from "@/lib/consultorio/types";

export function PrestacionesEditor({ initial }: { initial: FeeItem[] }) {
  const [fees, setFees] = useState(initial);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [chapter, setChapter] = useState("Consultorio");
  const [price, setPrice] = useState("");
  const [notice, setNotice] = useState("");

  const chapters = useMemo(() => Array.from(new Set(fees.map((item) => item.chapter))), [fees]);

  const visible = fees.filter((item) => {
    const haystack = `${item.name} ${item.chapter}`.toLocaleLowerCase("es");
    return haystack.includes(query.trim().toLocaleLowerCase("es"));
  });

  async function persist(next: FeeItem) {
    setFees((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
    });
    setNotice("Guardando…");
    const result = await saveOneFee(next);
    setNotice("error" in result ? "No se pudo guardar. Revisá la conexión." : "Guardado");
  }

  async function addFee() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const fee: FeeItem = {
      id: crypto.randomUUID(),
      code: "",
      chapter: chapter.trim() || "Consultorio",
      name: trimmed,
      minimum: null,
      price: parsePesos(price),
      offered: true,
    };
    setName("");
    setPrice("");
    await persist(fee);
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Mis precios</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">
        El mínimo es del Colegio de Odontólogos, al {collegeFeeDate}. No es lo que cobrás. Tu precio arranca igual a ese mínimo y lo podés cambiar. No se publica en la página.
      </p>
      <p className="mt-3 text-muted">
        Los implantes no están en esa lista. Agregalos al final, con el valor que cobrás. La hora de referencia del colegio es ${pesos(collegeHour.withCosts)} con costos y ${pesos(collegeHour.feesOnly)} de honorarios.
      </p>
      {notice ? <p className="mt-4 text-forest">{notice}</p> : null}

      <label className="mt-8 block" htmlFor="buscar-precio">
        Buscar
      </label>
      <input
        id="buscar-precio"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg"
      />

      <div className="mt-6 space-y-3">
        {chapters.map((group) => {
          const items = visible.filter((item) => item.chapter === group);
          if (items.length === 0) return null;
          return (
            <details key={`${group}-${query}`} open={query ? true : undefined} className="rounded-2xl border border-sand bg-white">
              <summary className="min-h-12 cursor-pointer list-none px-4 py-3 font-serif text-2xl marker:content-none [&::-webkit-details-marker]:hidden">
                {group}
              </summary>
              <div className="space-y-4 px-4 pb-4">
                {items.map((item) => (
                  <article key={item.id} className={item.offered === false ? "opacity-70" : undefined}>
                    <h2 className="text-lg text-forest">{item.name}</h2>
                    <p className="mt-1 text-muted">
                      {item.minimum == null ? "Sin mínimo del colegio" : `Mínimo del colegio: $${pesos(item.minimum)}`}
                    </p>
                    <label className="mt-3 block">
                      Tu precio
                      <span className="mt-2 flex min-h-12 items-center rounded-xl border border-sand bg-cream px-4">
                        <span aria-hidden="true">$</span>
                        <input
                          key={`${item.id}-${item.price ?? "vacio"}`}
                          defaultValue={pesos(item.price)}
                          inputMode="numeric"
                          aria-label={`Tu precio de ${item.name}`}
                          onBlur={(event) => {
                            const next = parsePesos(event.target.value);
                            if (next === item.price) return;
                            void persist({ ...item, price: next, offered: item.offered !== false });
                          }}
                          className="min-h-12 w-full bg-transparent px-2 text-lg"
                        />
                      </span>
                    </label>
                    <label className="mt-3 flex min-h-12 items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-6 w-6"
                        checked={item.offered === false}
                        onChange={(event) =>
                          void persist({ ...item, offered: !event.target.checked })
                        }
                      />
                      No la hago
                    </label>
                  </article>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl bg-panel p-4">
        <h2 className="font-serif text-3xl">Agregar una práctica</h2>
        <label className="mt-4 block">
          Nombre
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg" />
        </label>
        <label className="mt-4 block">
          Grupo
          <input value={chapter} onChange={(event) => setChapter(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg" />
        </label>
        <label className="mt-4 block">
          Tu precio
          <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="numeric" className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg" />
        </label>
        <button type="button" onClick={() => void addFee()} className="mt-4 inline-flex h-12 items-center rounded-full bg-forest px-5 text-lg text-cream">
          Agregar una práctica
        </button>
      </div>
    </div>
  );
}
