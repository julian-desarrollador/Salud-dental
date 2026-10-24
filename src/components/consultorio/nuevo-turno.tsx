"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buscarFichas, guardarTurno, ocupacionDelDia } from "@/app/consultorio/agenda/actions";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import {
  caeCadaQuince,
  diaCorto,
  diaDeSemana,
  duracionEnPalabras,
  duraciones,
  esDuracion,
  esHorarioDeInicio,
  grillaDelMes,
  horariosDeInicio,
  letrasSemana,
  pisaTramo,
  telefonoValido,
  terminaDespuesDeLas20,
  tituloMes,
  type Tramo,
} from "@/lib/consultorio/agenda-horario";
import { claveNombre } from "@/lib/consultorio/nombre";
import { todayInArgentina } from "@/lib/consultorio/fecha";

type Ficha = { id: string; name: string; contact: string };

const titulos = [
  { title: "Elegí la fecha", subtitle: "Cualquier día del mes" },
  { title: "Elegí el horario", subtitle: "" },
  { title: "Paciente", subtitle: "Buscá la ficha o creá una nueva" },
  { title: "Motivo", subtitle: "Qué va a hacer y cuánto dura" },
  { title: "Resumen", subtitle: "Revisá antes de guardar" },
] as const;

export function NuevoTurno({ dia }: { dia: string }) {
  const [step, setStep] = useState(1);
  const [year, setYear] = useState(Number(dia.slice(0, 4)));
  const [month, setMonth] = useState(Number(dia.slice(5, 7)));
  const [query, setQuery] = useState("");
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateKey, setDateKey] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [horaLibre, setHoraLibre] = useState<string | null>(null);
  const [duration, setDuration] = useState(15);
  const [otra, setOtra] = useState(false);
  const [minutosOtra, setMinutosOtra] = useState("");
  const [reason, setReason] = useState("");
  const [reminder, setReminder] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pasado, setPasado] = useState<string | null>(null);
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [aviso20, setAviso20] = useState<number | null>(null);
  const [aceptado20, setAceptado20] = useState("");
  const continuarRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  function bajarAContinuar() {
    requestAnimationFrame(() => {
      continuarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  useEffect(() => {
    if (!dateKey) {
      setTramos([]);
      return;
    }
    let vigente = true;
    void ocupacionDelDia(dateKey)
      .then((lista) => {
        if (vigente) setTramos(lista);
      })
      .catch(() => {
        if (vigente) setTramos([]);
      });
    return () => {
      vigente = false;
    };
  }, [dateKey]);

  useEffect(() => {
    if (timeLocal && pisaTramo(timeLocal, 15, tramos)) {
      setTimeLocal("");
      setError("Ese horario ya está ocupado.");
    }
  }, [timeLocal, tramos]);

  useEffect(() => {
    if (step !== 3) return;
    const timer = window.setTimeout(() => {
      void buscarFichas(query).then(setFichas).catch(() => setFichas([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, step]);

  useEffect(() => {
    if (step !== 3) return;
    const clave = claveNombre(query);
    if (clave.length < 2) return;
    const exactas = fichas.filter((ficha) => claveNombre(ficha.name) === clave);
    if (exactas.length !== 1) return;
    const ficha = exactas[0];
    setPatientId(ficha.id);
    setName(ficha.name);
    if (!phoneRef.current.trim()) {
      setPhone(ficha.contact);
      setReminder(telefonoValido(ficha.contact));
    }
  }, [fichas, query, step]);

  function aplicarDia(next: string) {
    if (next !== dateKey) setTimeLocal("");
    setDateKey(next);
    setError("");
    bajarAContinuar();
  }

  function elegirDia(next: string) {
    if (next < todayInArgentina() && next !== dateKey) {
      setPasado(next);
      return;
    }
    aplicarDia(next);
  }

  function confirmarPasado() {
    if (!pasado) return;
    const next = pasado;
    setPasado(null);
    aplicarDia(next);
  }

  function aplicarHora(hora: string) {
    setTimeLocal(hora);
    setError("");
    bajarAContinuar();
  }

  function elegirHoraLibre(value: string) {
    const hora = value.slice(0, 5);
    if (!hora) return;
    if (!esHorarioDeInicio(hora)) {
      setError("El horario tiene que estar entre 08:00 y 19:59.");
      return;
    }
    if (pisaTramo(hora, 15, tramos)) {
      setError("Ese horario ya está ocupado.");
      return;
    }
    if (!caeCadaQuince(hora)) {
      setHoraLibre(hora);
      return;
    }
    aplicarHora(hora);
  }

  function confirmarHoraLibre() {
    if (!horaLibre) return;
    const hora = horaLibre;
    setHoraLibre(null);
    aplicarHora(hora);
  }

  function mesAnterior() {
    if (month === 1) {
      setMonth(12);
      setYear((value) => value - 1);
      return;
    }
    setMonth((value) => value - 1);
  }

  function mesSiguiente() {
    if (month === 12) {
      setMonth(1);
      setYear((value) => value + 1);
      return;
    }
    setMonth((value) => value + 1);
  }

  function elegir(ficha: Ficha) {
    setPatientId(ficha.id);
    setName(ficha.name);
    setPhone(ficha.contact);
    setQuery(ficha.name);
    setReminder(telefonoValido(ficha.contact));
  }

  function seguir() {
    setError("");
    if (step === 1 && !dateKey) return;
    if (step === 2 && !timeLocal) return;
    if (step === 3 && name.trim().length < 2) {
      setError("Completá el nombre.");
      return;
    }
    if (step === 4 && reminder && phone.trim() && !telefonoValido(phone)) {
      setError("Revisá el teléfono para el recordatorio.");
      return;
    }
    if (step === 4) {
      const elegida = otra ? Number(minutosOtra) : duration;
      if (otra && !esDuracion(elegida)) {
        setError("La duración tiene que ser entre 5 y 240 minutos.");
        return;
      }
      if (pisaTramo(timeLocal, elegida, tramos)) {
        setError("Ese horario ya está ocupado.");
        return;
      }
      if (terminaDespuesDeLas20(timeLocal, elegida) && aceptado20 !== `${timeLocal}|${elegida}`) {
        setAviso20(elegida);
        return;
      }
      setDuration(elegida);
    }
    setStep((value) => value + 1);
  }

  function confirmarDespuesDe20() {
    if (aviso20 == null) return;
    setAceptado20(`${timeLocal}|${aviso20}`);
    setDuration(aviso20);
    setAviso20(null);
    setStep(5);
  }

  async function guardar() {
    setError("");
    setPending(true);
    const result = await guardarTurno({
      patientId,
      name,
      phone,
      dateKey,
      timeLocal,
      durationMinutes: duration,
      reason,
      reminder,
    });
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const meta = titulos[step - 1];
  const horarioListo = Boolean(timeLocal);
  const continuarApagado = (step === 1 && !dateKey) || (step === 2 && !horarioListo) || pending;
  const grilla = grillaDelMes(year, month);

  return (
    <div className="mx-auto max-w-lg lg:max-w-2xl">
      {step === 1 ? (
        <Link href={`/consultorio/agenda?dia=${dia}`} aria-label="Atrás" className={backClass}>
          <BackArrow />
        </Link>
      ) : (
        <button type="button" aria-label="Atrás" className={backClass} onClick={() => setStep((value) => value - 1)}>
          <BackArrow />
        </button>
      )}
      <h1 className="mt-3 font-serif text-4xl text-forest">{meta.title}</h1>
      <p className="mt-2 text-muted">
        {step === 2 && dateKey
          ? `${diaDeSemana(dateKey)} ${diaCorto(dateKey)} · 08:00 a 19:45`
          : meta.subtitle}
      </p>

      {step === 1 ? (
        <section className="mt-6 rounded-[22px] border border-sand bg-white p-4 lg:p-5">
          <div className="relative mb-3 flex items-center justify-center px-12">
            <button
              type="button"
              onClick={mesAnterior}
              aria-label="Mes anterior"
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-xl text-forest"
            >
              <Chevron direction="left" />
            </button>
            <p className="text-center font-semibold text-forest">{tituloMes(year, month)}</p>
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
              const selected = cell.dateKey === dateKey;
              return (
                <button
                  key={`${cell.dateKey}-${cell.inMonth}`}
                  type="button"
                  disabled={!cell.inMonth}
                  onClick={() => elegirDia(cell.dateKey)}
                  className="flex flex-col items-center py-1 disabled:cursor-default"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold lg:h-11 lg:w-11 ${selected ? "border-forest bg-forest text-cream" : cell.inMonth ? "border-[#e5e5e5] bg-white text-forest" : "border-transparent text-muted/40"}`}
                  >
                    {cell.day}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {horariosDeInicio().map((hora) => {
              const ocupada = pisaTramo(hora, 15, tramos);
              return (
                <button
                  key={hora}
                  type="button"
                  disabled={ocupada}
                  onClick={() => aplicarHora(hora)}
                  className={`h-12 rounded-xl border text-lg font-semibold disabled:cursor-default disabled:border-sand disabled:bg-panel disabled:text-muted disabled:opacity-50 ${timeLocal === hora ? "border-forest bg-forest text-cream" : "border-sand bg-white text-forest"}`}
                >
                  {hora}
                </button>
              );
            })}
          </div>
          <label className="mt-6 block text-forest" htmlFor="otro-horario">
            Otro horario
          </label>
          <input
            id="otro-horario"
            type="time"
            min="08:00"
            max="19:59"
            step={60}
            value={timeLocal}
            onChange={(event) => elegirHoraLibre(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest"
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 grid gap-4">
          <label className="text-forest" htmlFor="paciente">
            Nombre del paciente
          </label>
          <input
            id="paciente"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setName(event.target.value);
              setPatientId("");
            }}
            className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
          />
          {fichas.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border border-sand bg-white">
              {fichas.map((ficha) => (
                <li key={ficha.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${patientId === ficha.id ? "bg-sand/40" : ""}`}
                    onClick={() => elegir(ficha)}
                  >
                    <span className="text-forest">{ficha.name}</span>
                    <span className="text-sm text-muted">{ficha.contact}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-muted">Si el nombre ya está, se usa esa ficha. Si no está, se crea al guardar.</p>
          <label className="text-forest" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            inputMode="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setReminder(telefonoValido(event.target.value));
            }}
            className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-6 grid gap-4">
          <label className="text-forest" htmlFor="motivo">
            Motivo
          </label>
          <input
            id="motivo"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Consulta"
            className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
          />
          <p className="text-forest">Duración</p>
          <div className="grid grid-cols-2 gap-2">
            {duraciones.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setOtra(false);
                  setDuration(item);
                }}
                className={`h-12 rounded-xl border ${!otra && duration === item ? "border-forest bg-forest text-cream" : "border-sand bg-white text-forest"}`}
              >
                {duracionEnPalabras(item)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOtra(true)}
              className={`h-12 rounded-xl border ${otra ? "border-forest bg-forest text-cream" : "border-sand bg-white text-forest"}`}
            >
              Otra
            </button>
          </div>
          {otra ? (
            <label className="text-forest" htmlFor="minutos">
              Minutos
              <input
                id="minutos"
                inputMode="numeric"
                value={minutosOtra}
                onChange={(event) => setMinutosOtra(event.target.value.replace(/\D/g, "").slice(0, 3))}
                className="mt-2 min-h-12 w-full rounded-xl border border-sand bg-white px-4 text-lg text-forest"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="mt-6 rounded-[22px] border border-sand bg-white p-5">
          <dl className="grid gap-3 text-forest">
            <div>
              <dt className="text-muted">Paciente</dt>
              <dd>{name.trim()}</dd>
            </div>
            <div>
              <dt className="text-muted">Día</dt>
              <dd>
                {diaDeSemana(dateKey)} {diaCorto(dateKey)} · {timeLocal}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Duración</dt>
              <dd>{duracionEnPalabras(duration)}</dd>
            </div>
            <div>
              <dt className="text-muted">Motivo</dt>
              <dd>{reason.trim() || "Consulta"}</dd>
            </div>
          </dl>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={reminder}
              onChange={(event) => setReminder(event.target.checked)}
              className="mt-1 h-5 w-5 accent-forest"
            />
            <span>Avisar por WhatsApp el día anterior.</span>
          </label>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-[#6b2e2a]">{error}</p> : null}

      <div ref={continuarRef} className="mt-6 flex scroll-mb-28 justify-end">
        {step < 5 ? (
          <button
            type="button"
            disabled={continuarApagado}
            className="h-12 rounded-full bg-forest px-6 text-cream disabled:opacity-40"
            onClick={seguir}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="h-12 rounded-full bg-forest px-6 text-cream disabled:opacity-40"
            onClick={() => void guardar()}
          >
            Guardar turno
          </button>
        )}
      </div>
      {pasado ? (
        <Confirmacion
          title="Este día ya pasó"
          text="Es anterior a hoy. ¿Segura que querés elegirlo?"
          confirm="Sí, elegirlo"
          onClose={() => setPasado(null)}
          onConfirm={confirmarPasado}
        />
      ) : null}
      {horaLibre ? (
        <Confirmacion
          title="Este horario no es cada 15 minutos"
          text="¿Segura que querés usarlo?"
          confirm="Sí, usarlo"
          onClose={() => setHoraLibre(null)}
          onConfirm={confirmarHoraLibre}
        />
      ) : null}
      {aviso20 != null ? (
        <Confirmacion
          title="Termina después de las 20:00"
          text="Este turno termina después de las 20:00. ¿Segura que querés dejarlo?"
          confirm="Sí, dejarlo"
          onClose={() => setAviso20(null)}
          onConfirm={confirmarDespuesDe20}
        />
      ) : null}
    </div>
  );
}

const backClass = "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sand bg-white text-forest";

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
