"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createPatient } from "@/app/consultorio/actions";
import { Lupa } from "@/components/consultorio/lista-pacientes";
import { fechaEnPalabras } from "@/lib/consultorio/fecha";
import { pesos } from "@/lib/consultorio/money";

export type PresupuestoReciente = {
  patientId: string;
  patientName: string;
  id: string;
  /** Solo si Jesica lo cambió; el que se pone solo repite la fecha. */
  titulo: string;
  createdOn: string;
  sentOn: string;
  total: number;
  sinPrecio: number;
};

const VOLVER = encodeURIComponent("/consultorio/presupuesto");
const enlaceNuevo = (patientId: string) => `/consultorio/pacientes/${patientId}?tab=presupuestos&nuevo=1&volver=${VOLVER}`;
const enlacePresupuesto = (item: PresupuestoReciente) =>
  `/consultorio/pacientes/${item.patientId}?tab=presupuestos&volver=${VOLVER}#presupuesto-${item.id}`;

function BotonCrear({ nombre }: { nombre: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest bg-white px-5 text-lg text-forest disabled:opacity-60"
    >
      {pending ? "Creando…" : `Crear ficha de ${nombre}`}
    </button>
  );
}

/** Cuántos pacientes se muestran de entrada y cuántos más suma cada "Ver más". */
const PASO = 8;

export function NuevoPresupuesto({ pacientes }: { pacientes: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [limite, setLimite] = useState(PASO);
  const nombre = query.trim();
  const texto = nombre.toLocaleLowerCase("es");
  const encontrados = texto ? pacientes.filter((item) => item.name.toLocaleLowerCase("es").includes(texto)) : pacientes;
  const visibles = encontrados.slice(0, limite);
  const quedan = encontrados.length - visibles.length;
  return (
    <section aria-labelledby="nuevo-presupuesto" className="rounded-2xl border border-sand bg-white p-5">
      <h2 id="nuevo-presupuesto" className="font-serif text-3xl">
        Nuevo presupuesto
      </h2>
      <label className="mt-4 block text-forest" htmlFor="paciente-presupuesto">
        ¿Para qué paciente?
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          <Lupa />
        </span>
        <input
          id="paciente-presupuesto"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimite(PASO);
          }}
          placeholder="Escribí el nombre"
          className="min-h-14 w-full rounded-xl border border-sand bg-white pr-4 pl-12 text-lg text-forest"
        />
      </div>
      <p className="mt-2 text-muted" aria-live="polite">
        {texto
          ? `${encontrados.length} de ${pacientes.length}`
          : pacientes.length > 0
            ? "Tocá al paciente y se abre su presupuesto, listo para cargar."
            : "Todavía no hay pacientes."}
      </p>
      {texto && encontrados.length === 0 ? (
        <form action={createPatient} className="mt-4">
          <p className="text-forest">No hay nadie con «{nombre}».</p>
          <input type="hidden" name="name" value={nombre} />
          <div className="mt-3">
            <BotonCrear nombre={nombre} />
          </div>
        </form>
      ) : null}
      {visibles.length > 0 ? (
        <ul className="mt-3 divide-y divide-sand rounded-2xl border border-sand">
          {visibles.map((item) => (
            <li key={item.id}>
              <Link href={enlaceNuevo(item.id)} className="flex min-h-14 items-center justify-between gap-3 px-4 text-forest">
                <span className="text-lg">{item.name}</span>
                <span className="shrink-0 text-muted">
                  Armar <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {quedan > 0 ? (
        <button
          type="button"
          onClick={() => setLimite((actual) => actual + PASO)}
          className="mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-5 text-lg text-forest"
        >
          Ver más ({quedan === 1 ? "queda 1" : `quedan ${quedan}`})
        </button>
      ) : null}
    </section>
  );
}

export function TarjetaMisPrecios({ prestaciones, categorias }: { prestaciones: number; categorias: number }) {
  const vacia = prestaciones === 0;
  return (
    <section
      aria-labelledby="mis-precios"
      className={`rounded-2xl bg-white p-5 ${vacia ? "border-2 border-gold" : "border border-sand"}`}
    >
      <h2 id="mis-precios" className="font-serif text-3xl">
        Mis precios
      </h2>
      <p className="mt-3 text-forest">
        {vacia
          ? "Todavía no cargaste tus precios. Cargalos una vez y después los elegís al armar cada presupuesto."
          : `${prestaciones} ${prestaciones === 1 ? "prestación" : "prestaciones"}${
              categorias > 0 ? ` en ${categorias} ${categorias === 1 ? "categoría" : "categorías"}` : ""
            }.`}
      </p>
      <Link
        href="/consultorio/presupuesto/precios"
        className={`mt-4 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-lg ${
          vacia ? "bg-forest text-cream" : "border border-forest bg-white text-forest"
        }`}
      >
        {vacia ? "Cargar mis precios" : "Ver y editar mis precios"}
      </Link>
    </section>
  );
}

export function PresupuestosRecientes({ items }: { items: PresupuestoReciente[] }) {
  return (
    <section aria-labelledby="presupuestos-recientes">
      <h2 id="presupuestos-recientes" className="font-serif text-3xl">
        Últimos presupuestos
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-forest">Todavía no armaste presupuestos.</p>
      ) : (
        <ul className="mt-3 divide-y divide-sand rounded-2xl border border-sand bg-white">
          {items.map((item) => (
            <li key={`${item.patientId}-${item.id}`}>
              <Link href={enlacePresupuesto(item)} className="block px-4 py-3 text-forest">
                <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="text-lg font-semibold">{item.patientName}</span>
                  <span className="text-lg">$ {pesos(item.total)}</span>
                </span>
                {item.titulo ? <span className="block">{item.titulo}</span> : null}
                <span className="mt-0.5 flex flex-wrap gap-x-3 text-muted">
                  {item.createdOn ? <span>{fechaEnPalabras(item.createdOn)}</span> : null}
                  {item.sentOn ? (
                    <span className="text-forest">✓ Enviado</span>
                  ) : (
                    <span>Sin enviar</span>
                  )}
                  {item.sinPrecio > 0 ? <span>{item.sinPrecio} sin precio</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
