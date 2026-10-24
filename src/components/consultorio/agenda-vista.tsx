"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CancelarTurno, QuitarBloqueo } from "@/components/consultorio/agenda-acciones";
import type { Bloqueo, Turno } from "@/lib/consultorio/agenda";
import {
  diaCorto,
  diaDeSemana,
  duracionEnPalabras,
  grillaDelMes,
  hrefAgenda,
  letrasSemana,
  tituloMes,
} from "@/lib/consultorio/agenda-horario";

export function AgendaVista({
  year,
  month,
  dia,
  canceladas,
  whatsappFallo,
  turnos,
  bloqueos,
}: {
  year: number;
  month: number;
  dia: string;
  canceladas: boolean;
  whatsappFallo: boolean;
  turnos: Turno[];
  bloqueos: Bloqueo[];
}) {
  const mes = `${year}-${String(month).padStart(2, "0")}`;
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const prevKey = `${prev.year}-${String(prev.month).padStart(2, "0")}`;
  const nextKey = `${next.year}-${String(next.month).padStart(2, "0")}`;
  const grid = grillaDelMes(year, month);
  const ocupados = new Set<string>();
  for (const turno of turnos) {
    if (turno.status === "confirmed") ocupados.add(turno.dateKey);
  }
  for (const bloqueo of bloqueos) ocupados.add(bloqueo.dateKey);

  const delDia = turnos
    .filter((turno) => turno.dateKey === dia && (canceladas || turno.status === "confirmed"))
    .map((turno) => ({ kind: "turno" as const, start: turno.timeLocal, turno }));
  const bloqueosDia = bloqueos
    .filter((bloqueo) => bloqueo.dateKey === dia)
    .map((bloqueo) => ({ kind: "bloqueo" as const, start: bloqueo.start, bloqueo }));
  const filas = [...delDia, ...bloqueosDia].sort((a, b) => a.start.localeCompare(b.start) || a.kind.localeCompare(b.kind));
  const eventos = turnos.filter((turno) => turno.dateKey === dia && turno.status === "confirmed").length + bloqueosDia.length;
  const cancelados = turnos.filter((turno) => turno.dateKey === dia && turno.status === "cancelled").length;
  useEffect(() => {
    if (window.location.hash !== "#dia-elegido") return;
    const enfocar = () => document.getElementById("dia-elegido")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const pronto = window.setTimeout(enfocar, 80);
    const despues = window.setTimeout(enfocar, 240);
    return () => {
      window.clearTimeout(pronto);
      window.clearTimeout(despues);
    };
  }, []);

  function enfocarReservas(alCambiar?: () => boolean) {
    const enfocar = () => document.getElementById("dia-elegido")?.scrollIntoView({ behavior: "smooth", block: "start" });
    enfocar();
    if (!alCambiar) return;
    const empezar = performance.now();
    const id = window.setInterval(() => {
      if (!alCambiar() && performance.now() - empezar < 2000) return;
      window.clearInterval(id);
      window.setTimeout(enfocar, 60);
    }, 40);
  }

  function irAlDia(dateKey: string) {
    enfocarReservas(dateKey === dia ? undefined : () => window.location.search.includes(`dia=${dateKey}`));
  }

  return (
    <div className="mx-auto max-w-lg lg:max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">Consultorio</p>
      <h1 className="mt-1 font-serif text-4xl leading-none text-forest">Agenda</h1>
      <p className="mt-2 text-muted">Od. Jesica Brenda Goroso</p>

      {whatsappFallo ? (
        <p role="status" className="mt-5 rounded-2xl border border-[#6b2e2a] bg-white px-4 py-3 text-[#6b2e2a]">
          El turno quedó guardado, pero no salió el WhatsApp.
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href={`/consultorio/agenda/nuevo?dia=${dia}`}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest text-cream"
        >
          <PlusIcon />
          Agregar turno
        </Link>
        <Link
          href={`/consultorio/agenda/bloqueo?dia=${dia}`}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-sand bg-white text-forest"
        >
          <LockIcon />
          Bloquear horario
        </Link>
      </div>
      <Link
        href="/consultorio/pacientes"
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl border border-sand bg-white text-forest"
      >
        <PersonIcon />
        Pacientes
      </Link>

      <section className="mt-5 rounded-[22px] border border-sand bg-white p-4 lg:p-5">
        <div className="relative mb-3 flex items-center justify-center px-12">
          <Link
            href={hrefAgenda(prevKey, `${prevKey}-01`)}
            aria-label="Mes anterior"
            className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-xl text-forest"
          >
            <Chevron direction="left" />
          </Link>
          <p className="text-center font-semibold text-forest">{tituloMes(year, month)}</p>
          <Link
            href={hrefAgenda(nextKey, `${nextKey}-01`)}
            aria-label="Mes siguiente"
            className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-xl text-forest"
          >
            <Chevron direction="right" />
          </Link>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold tracking-wide text-muted">
          {letrasSemana.map((letra) => (
            <div key={letra} className="py-2">
              {letra}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center">
          {grid.map((cell) => {
            const selected = cell.dateKey === dia;
            const [cellYear, cellMonth] = cell.dateKey.split("-");
            return (
              <Link
                key={`${cell.dateKey}-${cell.inMonth}`}
                href={hrefAgenda(`${cellYear}-${cellMonth}`, cell.dateKey, canceladas)}
                scroll={false}
                onClick={() => irAlDia(cell.dateKey)}
                className="flex flex-col items-center py-1"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold lg:h-11 lg:w-11 ${selected ? "border-forest bg-forest text-cream" : cell.inMonth ? "border-[#e5e5e5] bg-white text-forest" : "border-transparent text-muted"}`}
                >
                  {cell.day}
                </span>
                <span className="mt-0.5 flex h-3 items-center justify-center">
                  {ocupados.has(cell.dateKey) ? <span className="block h-2.5 w-2.5 rounded-full bg-[#e6b325]" /> : null}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div id="dia-elegido" className="mt-5 scroll-mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-3xl leading-tight text-forest">{diaDeSemana(dia)}</p>
          <p className="text-muted">{diaCorto(dia)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={hrefAgenda(mes, dia, !canceladas)}
            scroll={false}
            onClick={() => enfocarReservas(() => window.location.search.includes("canceladas=1") === !canceladas)}
            className={`rounded-2xl border px-3 py-2 text-sm ${canceladas ? "border-[#6b2e2a] text-[#6b2e2a]" : "border-sand bg-white text-muted"}`}
            aria-pressed={canceladas}
          >
            {cancelados} {cancelados === 1 ? "Cancelada" : "Canceladas"}
          </Link>
          <p className="rounded-2xl border border-sand bg-white px-3 py-2 text-sm text-forest">
            {eventos} {eventos === 1 ? "evento" : "eventos"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {filas.length === 0 ? (
          <p className="py-10 text-center text-muted">No hay turnos ni bloqueos este día.</p>
        ) : (
          filas.map((fila) =>
            fila.kind === "bloqueo" ? (
              <article key={fila.bloqueo.id} className="rounded-[22px] border border-sand bg-white p-5">
                <p className="text-lg font-semibold text-forest">
                  {fila.bloqueo.start} – {fila.bloqueo.end}
                </p>
                <h2 className="mt-2 font-serif text-3xl text-forest">Horario bloqueado</h2>
                <p className="mt-2 text-forest">{fila.bloqueo.note || "Sin nota"}</p>
                <QuitarBloqueo id={fila.bloqueo.id} dia={dia} />
              </article>
            ) : (
              <article
                key={fila.turno.id}
                className={`rounded-[22px] border border-sand bg-white p-5 ${fila.turno.status === "cancelled" ? "opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold text-forest">{fila.turno.timeLocal}</p>
                  <p className="text-muted">{duracionEnPalabras(fila.turno.durationMinutes)}</p>
                </div>
                <h2 className="mt-2 font-serif text-3xl leading-tight text-forest">{fila.turno.patientName}</h2>
                {fila.turno.status === "cancelled" ? <p className="mt-1 text-[#6b2e2a]">Cancelada</p> : null}
                <p className="mt-3 text-forest">{fila.turno.reason}</p>
                <p className="mt-3 rounded-xl border border-sand bg-cream px-3 py-2.5 text-forest">
                  <span className="block">
                    Asignación de turno: {fila.turno.status === "cancelled" ? "No se envía" : fila.turno.waAssignmentSentAt ? "Enviada" : "No enviada"}
                  </span>
                  <span className="mt-1 block">
                    Recordatorio 24h:{" "}
                    {fila.turno.status === "cancelled"
                      ? "No se envía"
                      : !fila.turno.reminder
                        ? "Sin recordatorio"
                        : fila.turno.waReminder24hSentAt
                          ? "Enviado"
                          : "Aún no enviado"}
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-sand pt-4">
                  <Link
                    href={`/consultorio/pacientes/${fila.turno.patientId}?volver=${encodeURIComponent(`${hrefAgenda(mes, dia, canceladas)}#dia-elegido`)}`}
                    className="inline-flex items-center gap-1.5 text-gold-ink"
                  >
                    <SheetIcon />
                    Ver ficha
                  </Link>
                  {fila.turno.status === "confirmed" ? <CancelarTurno id={fila.turno.id} dia={dia} /> : null}
                </div>
              </article>
            ),
          )
        )}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path strokeLinecap="round" d="M14 3.5V9h5.5M8.5 13h7M8.5 16.5h5" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path strokeLinecap="round" d="M6 19v-.3c0-2.2 2.4-3.7 6-3.7s6 1.5 6 3.7V19" />
    </svg>
  );
}
