"use client";

import Link from "next/link";
import { useState } from "react";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import { CampoPrecio } from "@/components/consultorio/precios-planilla";
import { telefonoValido } from "@/lib/consultorio/agenda-horario";
import { fechaEnPalabras, todayInArgentina } from "@/lib/consultorio/fecha";
import { pesos } from "@/lib/consultorio/money";
import {
  MAX_NOMBRE_PRESTACION,
  MAX_TIPO,
  mensajePresupuesto,
  presupuestoNuevo,
  subtotal,
  totalDe,
} from "@/lib/consultorio/presupuesto";
import type { FeeItem, ItemPresupuesto, Presupuesto } from "@/lib/consultorio/types";
import { abrirWhatsapp, enlaceWhatsapp } from "@/lib/consultorio/whatsapp";

const celda = "min-h-12 w-full rounded-xl border border-sand bg-white px-3 text-lg";
const accion =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-forest bg-white px-4 text-base text-forest disabled:cursor-default disabled:opacity-40";
const columnas = "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_5rem_9rem_8rem_auto]";

function nuevoItem(base: Partial<ItemPresupuesto> = {}): ItemPresupuesto {
  return { id: crypto.randomUUID(), tipo: "", name: "", cantidad: 1, precio: null, ...base };
}

function SelectorPrecios({ precios, onElegir, onCerrar }: { precios: FeeItem[]; onElegir: (fee: FeeItem) => void; onCerrar: () => void }) {
  const [query, setQuery] = useState("");
  const texto = query.trim().toLocaleLowerCase("es");
  const visibles = precios.filter((fee) => `${fee.name} ${fee.chapter}`.toLocaleLowerCase("es").includes(texto));
  const tipos = Array.from(new Set(visibles.map((fee) => fee.chapter.trim())));
  return (
    <div className="mt-3 rounded-2xl border border-forest bg-cream p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-56">
          Buscar en mi lista
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={`mt-1 ${celda}`} />
        </label>
        <button type="button" className={accion} onClick={onCerrar}>
          Listo
        </button>
      </div>
      {precios.length === 0 ? (
        <p className="mt-3 text-forest">
          Tu lista de precios está vacía.{" "}
          <Link href="/consultorio/presupuesto" className="underline underline-offset-4">
            Cargala en Presupuesto
          </Link>
          .
        </p>
      ) : visibles.length === 0 ? (
        <p className="mt-3 text-forest">No hay prestaciones con ese texto.</p>
      ) : (
        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
          {tipos.map((tipo) => (
            <div key={tipo || "sin-tipo"}>
              <p className="text-sm font-semibold text-muted">{tipo || "Sin tipo"}</p>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {visibles
                  .filter((fee) => fee.chapter.trim() === tipo)
                  .map((fee) => (
                    <button
                      key={fee.id}
                      type="button"
                      onClick={() => onElegir(fee)}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-sand bg-white px-3 text-left text-base text-forest"
                    >
                      <span>{fee.name}</span>
                      <span className="shrink-0 text-muted">{fee.price == null ? "a confirmar" : `$${pesos(fee.price)}`}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaPresupuesto({
  presupuesto,
  precios,
  paciente,
  onChange,
  onDuplicar,
  onQuitar,
}: {
  presupuesto: Presupuesto;
  precios: FeeItem[];
  paciente: { name: string; contact: string };
  onChange: (presupuesto: Presupuesto) => void;
  onDuplicar: () => void;
  onQuitar: () => void;
}) {
  const [eligiendo, setEligiendo] = useState(false);
  const [nuevaFila, setNuevaFila] = useState<string | null>(null);
  const { total, sinPrecio } = totalDe(presupuesto);
  const conFilas = presupuesto.items.some((item) => item.name.trim());
  const tipos = Array.from(new Set(precios.map((fee) => fee.chapter.trim()).filter(Boolean)));
  const listaTipos = `tipos-presupuesto-${presupuesto.id}`;

  function cambiarItems(cambio: (items: ItemPresupuesto[]) => ItemPresupuesto[]) {
    onChange({ ...presupuesto, items: cambio(presupuesto.items) });
  }

  function editarItem(id: string, cambios: Partial<ItemPresupuesto>) {
    cambiarItems((items) => items.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function compartir() {
    const url = enlaceWhatsapp(paciente.contact, mensajePresupuesto(paciente.name, presupuesto));
    onChange({ ...presupuesto, sentOn: todayInArgentina() });
    abrirWhatsapp(url);
  }

  return (
    <article id={`presupuesto-${presupuesto.id}`} className="scroll-mt-4 rounded-2xl border border-sand bg-white p-4">
      <label className="block">
        <span className="sr-only">Título del presupuesto</span>
        <input
          value={presupuesto.titulo}
          maxLength={120}
          aria-label="Título del presupuesto"
          onChange={(event) => onChange({ ...presupuesto, titulo: event.target.value })}
          className="min-h-12 w-full rounded-xl border border-transparent bg-transparent px-2 font-serif text-2xl text-forest hover:border-sand focus:border-sand"
        />
      </label>
      <p className="px-2 text-muted">
        {presupuesto.createdOn ? `Armado el ${fechaEnPalabras(presupuesto.createdOn)}` : ""}
        {presupuesto.sentOn ? ` · Enviado el ${fechaEnPalabras(presupuesto.sentOn)}` : ""}
      </p>

      <datalist id={listaTipos}>
        {tipos.map((tipo) => (
          <option key={tipo} value={tipo} />
        ))}
      </datalist>

      <div role="table" aria-label={presupuesto.titulo || "Presupuesto"} className="mt-4">
        <div role="row" className={`hidden gap-2 px-1 pb-2 text-muted md:grid ${columnas}`}>
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Prestación</span>
          <span role="columnheader">Cant.</span>
          <span role="columnheader" className="text-right">
            Precio
          </span>
          <span role="columnheader" className="text-right">
            Subtotal
          </span>
          <span role="columnheader" className="sr-only">
            Acciones
          </span>
        </div>
        {presupuesto.items.length === 0 ? <p className="text-muted">Todavía no tiene filas.</p> : null}
        <div className="space-y-3 md:space-y-2">
          {presupuesto.items.map((item, indice) => {
            const valor = subtotal(item);
            return (
              <div
                key={item.id}
                role="row"
                className={`grid grid-cols-2 gap-2 rounded-xl border border-sand p-3 md:items-center md:border-0 md:p-0 ${columnas}`}
              >
                <label role="cell" className="col-span-2 block md:col-span-1">
                  <span className="text-muted md:sr-only">Categoría</span>
                  <input
                    value={item.tipo}
                    list={listaTipos}
                    maxLength={MAX_TIPO}
                    aria-label={`Categoría, fila ${indice + 1}`}
                    onChange={(event) => editarItem(item.id, { tipo: event.target.value })}
                    className={`mt-1 md:mt-0 ${celda}`}
                  />
                </label>
                <label role="cell" className="col-span-2 block md:col-span-1">
                  <span className="text-muted md:sr-only">Prestación</span>
                  <input
                    value={item.name}
                    autoFocus={item.id === nuevaFila}
                    maxLength={MAX_NOMBRE_PRESTACION}
                    aria-label={`Prestación, fila ${indice + 1}`}
                    onChange={(event) => editarItem(item.id, { name: event.target.value })}
                    className={`mt-1 md:mt-0 ${celda}`}
                  />
                </label>
                <label role="cell" className="block">
                  <span className="text-muted md:sr-only">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    inputMode="numeric"
                    value={item.cantidad}
                    aria-label={`Cantidad, fila ${indice + 1}`}
                    onChange={(event) => {
                      const numero = Math.round(Number(event.target.value));
                      editarItem(item.id, { cantidad: Number.isFinite(numero) && numero >= 1 ? Math.min(numero, 999) : 1 });
                    }}
                    className={`mt-1 md:mt-0 ${celda}`}
                  />
                </label>
                <div role="cell">
                  <span className="text-muted md:sr-only">Precio</span>
                  <CampoPrecio
                    value={item.precio}
                    etiqueta={`Precio, fila ${indice + 1}`}
                    onChange={(precio) => editarItem(item.id, { precio })}
                    className="mt-1 md:mt-0"
                  />
                </div>
                <p role="cell" className="flex min-h-12 flex-col justify-center text-lg text-forest md:items-end">
                  <span className="text-muted md:sr-only">Subtotal</span>
                  <span className="whitespace-nowrap">{valor == null ? "a confirmar" : `$${pesos(valor)}`}</span>
                </p>
                <div role="cell" className="flex items-center justify-end">
                  <button
                    type="button"
                    className={accion}
                    aria-label={`Quitar la fila ${indice + 1}`}
                    onClick={() => cambiarItems((items) => items.filter((fila) => fila.id !== item.id))}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={accion} disabled={presupuesto.items.length >= 100} onClick={() => setEligiendo((actual) => !actual)}>
          Agregar de mi lista
        </button>
        <button
          type="button"
          className={accion}
          disabled={presupuesto.items.length >= 100}
          onClick={() => {
            const item = nuevoItem();
            setNuevaFila(item.id);
            cambiarItems((items) => [...items, item]);
          }}
        >
          Agregar fila libre
        </button>
      </div>
      {eligiendo ? (
        <SelectorPrecios
          precios={precios}
          onCerrar={() => setEligiendo(false)}
          onElegir={(fee) => {
            if (presupuesto.items.length >= 100) return;
            cambiarItems((items) => [...items, nuevoItem({ tipo: fee.chapter, name: fee.name, precio: fee.price })]);
          }}
        />
      ) : null}

      <div className="mt-5 border-t border-sand pt-4 text-right">
        <p className="font-serif text-3xl text-forest">Total: ${pesos(total)}</p>
        {sinPrecio > 0 ? (
          <p className="text-muted">
            {sinPrecio === 1 ? "1 fila está a confirmar y no suma." : `${sinPrecio} filas están a confirmar y no suman.`}
          </p>
        ) : null}
      </div>

      <label className="mt-4 block">
        Nota para el paciente
        <textarea
          value={presupuesto.nota}
          rows={2}
          maxLength={2000}
          placeholder="Por ejemplo: forma de pago, cuotas o validez del presupuesto"
          onChange={(event) => onChange({ ...presupuesto, nota: event.target.value })}
          className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-lg"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!conFilas}
          onClick={compartir}
          className="inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40"
        >
          Compartir por WhatsApp
        </button>
        <button type="button" className={accion} onClick={onDuplicar}>
          Duplicar
        </button>
        <button type="button" className="inline-flex min-h-11 items-center px-2 text-[#6b2e2a]" onClick={onQuitar}>
          Quitar presupuesto
        </button>
      </div>
      {!telefonoValido(paciente.contact) ? (
        <p className="mt-2 text-muted">La ficha no tiene un teléfono válido: WhatsApp se abre para que elijas el contacto.</p>
      ) : null}
    </article>
  );
}

export function PresupuestosPaciente({
  patientId,
  presupuestos,
  precios,
  paciente,
  onChange,
}: {
  patientId: string;
  presupuestos: Presupuesto[];
  precios: FeeItem[];
  paciente: { name: string; contact: string };
  onChange: (presupuestos: Presupuesto[]) => void;
}) {
  const [aQuitar, setAQuitar] = useState<Presupuesto | null>(null);

  function nuevo() {
    onChange([presupuestoNuevo(), ...presupuestos]);
  }

  function duplicar(original: Presupuesto) {
    const hoy = todayInArgentina();
    const copia: Presupuesto = {
      ...original,
      id: crypto.randomUUID(),
      titulo: `${original.titulo} (copia)`.slice(0, 120),
      createdOn: hoy,
      sentOn: "",
      items: original.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    };
    onChange([copia, ...presupuestos]);
  }

  return (
    <div>
      <p className="mt-3 text-forest">
        Armá el presupuesto con tu lista de precios o con filas libres, y mandalo por WhatsApp.{" "}
        <Link
          href={`/consultorio/presupuesto/precios?volver=${encodeURIComponent(`/consultorio/pacientes/${patientId}?tab=presupuestos`)}`}
          className="underline underline-offset-4"
        >
          Editar mis precios
        </Link>
      </p>
      <button
        type="button"
        onClick={nuevo}
        disabled={presupuestos.length >= 50}
        className="mt-4 inline-flex min-h-12 items-center rounded-full bg-forest px-5 text-lg text-cream disabled:opacity-40"
      >
        Nuevo presupuesto
      </button>
      {presupuestos.length === 0 ? <p className="mt-6 text-forest">Todavía no hay presupuestos.</p> : null}
      <div className="mt-6 space-y-6">
        {presupuestos.map((presupuesto) => (
          <TarjetaPresupuesto
            key={presupuesto.id}
            presupuesto={presupuesto}
            precios={precios}
            paciente={paciente}
            onChange={(cambiado) => onChange(presupuestos.map((item) => (item.id === cambiado.id ? cambiado : item)))}
            onDuplicar={() => duplicar(presupuesto)}
            onQuitar={() => setAQuitar(presupuesto)}
          />
        ))}
      </div>
      {aQuitar ? (
        <Confirmacion
          title="¿Quitar este presupuesto?"
          text={`"${aQuitar.titulo || "Presupuesto"}" se borra de la ficha.`}
          confirm="Quitar"
          onConfirm={() => {
            onChange(presupuestos.filter((item) => item.id !== aQuitar.id));
            setAQuitar(null);
          }}
          onClose={() => setAQuitar(null)}
        />
      ) : null}
    </div>
  );
}
