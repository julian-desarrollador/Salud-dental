"use server";

import { redirect } from "next/navigation";
import { hrefAgenda, mesDe, minutos, type Tramo } from "@/lib/consultorio/agenda-horario";
import { buscarPacientes, cancelarTurno, crearBloqueo, crearTurno, leerAgenda, quitarBloqueo } from "@/lib/consultorio/agenda";
import { requireSession } from "@/lib/consultorio/guard";

function esRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function buscarFichas(query: string) {
  await requireSession();
  return buscarPacientes(query);
}

export async function ocupacionDelDia(dateKey: string): Promise<Tramo[]> {
  await requireSession();
  const agenda = await leerAgenda(dateKey, dateKey);
  const tramos: Tramo[] = [];
  for (const turno of agenda.turnos) {
    if (turno.status !== "confirmed") continue;
    const start = minutos(turno.timeLocal);
    if (start == null) continue;
    tramos.push({ start, end: start + turno.durationMinutes });
  }
  for (const bloqueo of agenda.bloqueos) {
    const start = minutos(bloqueo.start);
    const end = minutos(bloqueo.end);
    if (start == null || end == null) continue;
    tramos.push({ start, end });
  }
  return tramos;
}

export async function guardarTurno(input: {
  patientId: string;
  name: string;
  phone: string;
  dateKey: string;
  timeLocal: string;
  durationMinutes: number;
  reason: string;
  reminder: boolean;
}): Promise<{ error: string }> {
  await requireSession();
  try {
    const { turno, whatsappEnviado } = await crearTurno(input);
    const destino = hrefAgenda(mesDe(turno.dateKey), turno.dateKey);
    redirect(whatsappEnviado ? destino : `${destino}&whatsapp=no`);
  } catch (error) {
    if (esRedirect(error)) throw error;
    return { error: error instanceof Error ? error.message : "No se pudo guardar el turno." };
  }
}

export async function anularTurno(id: string, dia: string) {
  await requireSession();
  await cancelarTurno(id);
  redirect(hrefAgenda(mesDe(dia), dia, true));
}

export async function guardarBloqueo(input: {
  dateKey: string;
  start: string;
  end: string;
  note: string;
}): Promise<{ error: string }> {
  await requireSession();
  try {
    const bloqueo = await crearBloqueo(input);
    redirect(hrefAgenda(mesDe(bloqueo.dateKey), bloqueo.dateKey));
  } catch (error) {
    if (esRedirect(error)) throw error;
    return { error: error instanceof Error ? error.message : "No se pudo bloquear el horario." };
  }
}

export async function borrarBloqueo(id: string, dia: string) {
  await requireSession();
  await quitarBloqueo(id);
  redirect(hrefAgenda(mesDe(dia), dia));
}
