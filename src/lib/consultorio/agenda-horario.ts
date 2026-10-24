import { isIsoDate, todayInArgentina } from "./fecha";

export const duraciones = [15, 30, 45, 60, 90] as const;
export type Duracion = (typeof duraciones)[number];

export const letrasSemana = ["L", "M", "X", "J", "V", "S", "D"] as const;

export type DiaCalendario = { day: number; inMonth: boolean; dateKey: string };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function esDuracion(value: number) {
  return Number.isInteger(value) && value >= 5 && value <= 240;
}

export function horariosDeInicio() {
  const slots: string[] = [];
  for (let minute = 8 * 60; minute <= 19 * 60 + 45; minute += 15) {
    slots.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
  }
  return slots;
}

export function horariosDeFin() {
  const slots: string[] = [];
  for (let minute = 8 * 60 + 15; minute <= 20 * 60; minute += 15) {
    slots.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
  }
  return slots;
}

export function esHorarioDeInicio(value: string) {
  const minute = minutos(value);
  return minute != null && minute >= 8 * 60 && minute <= 19 * 60 + 59;
}

export function caeCadaQuince(value: string) {
  const minute = minutos(value);
  return minute != null && minute % 15 === 0;
}

export function minutos(hhmm: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function sePisan(start: number, end: number, otherStart: number, otherEnd: number) {
  return start < otherEnd && otherStart < end;
}

export type Tramo = { start: number; end: number };

export function pisaTramo(inicio: string, duracion: number, tramos: Tramo[]) {
  const start = minutos(inicio);
  if (start == null) return false;
  return tramos.some((tramo) => sePisan(start, start + duracion, tramo.start, tramo.end));
}

export function terminaDespuesDeLas20(inicio: string, duracion: number) {
  const start = minutos(inicio);
  return start != null && start + duracion > 20 * 60;
}

export function duracionEnPalabras(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${hours} h ${rest} min`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} min`;
}

export function sumarDias(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function mananaEnArgentina(now = new Date()) {
  return sumarDias(todayInArgentina(now), 1);
}

export function grillaDelMes(year: number, month: number): DiaCalendario[] {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const mondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const prevLast = new Date(year, month - 1, 0).getDate();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const cells: DiaCalendario[] = [];

  for (let index = 0; index < mondayOffset; index += 1) {
    const day = prevLast - mondayOffset + index + 1;
    cells.push({ day, inMonth: false, dateKey: `${prevYear}-${pad(prevMonth)}-${pad(day)}` });
  }
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({ day, inMonth: true, dateKey: `${year}-${pad(month)}-${pad(day)}` });
  }

  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      day: nextDay,
      inMonth: false,
      dateKey: `${nextYear}-${pad(nextMonth)}-${pad(nextDay)}`,
    });
    nextDay += 1;
  }
  return cells;
}

export function tituloMes(year: number, month: number) {
  const raw = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function diaDeSemana(iso: string) {
  if (!isIsoDate(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const raw = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "long" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function diaCorto(iso: string) {
  if (!isIsoDate(iso)) return iso;
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "long" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function fechaCorta(iso: string) {
  if (!isIsoDate(iso)) return iso;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function mesDe(iso: string) {
  return iso.slice(0, 7);
}

export function leerMes(value: string | undefined, hoy: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return { year: Number(hoy.slice(0, 4)), month: Number(hoy.slice(5, 7)), key: hoy.slice(0, 7) };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { year: Number(hoy.slice(0, 4)), month: Number(hoy.slice(5, 7)), key: hoy.slice(0, 7) };
  return { year, month, key: `${match[1]}-${match[2]}` };
}

export function hrefAgenda(mes: string, dia: string, canceladas = false) {
  const query = new URLSearchParams({ mes, dia });
  if (canceladas) query.set("canceladas", "1");
  return `/consultorio/agenda?${query}`;
}

export function telefonoValido(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function aWhatsapp(value: string) {
  let phone = value.replace(/\D/g, "");
  if (!phone) throw new Error("Teléfono inválido");
  if (phone.startsWith("549")) {
    // ya está en el formato de WhatsApp Argentina
  } else if (phone.startsWith("54")) {
    phone = `549${phone.slice(2)}`;
  } else if (phone.startsWith("9")) {
    phone = `54${phone}`;
  } else {
    phone = `549${phone}`;
  }
  return `whatsapp:+${phone}`;
}
