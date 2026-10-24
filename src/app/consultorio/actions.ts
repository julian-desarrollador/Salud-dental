"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  consultorioPassword,
  requireSession,
  sessionCookieOptions,
} from "@/lib/consultorio/guard";
import { sameSecret, sessionCookie, sessionToken } from "@/lib/consultorio/session";
import {
  addChartFile,
  addPatientRecord,
  createConsentLink,
  fichasConNombre,
  removeChartFile,
  removePatientRecord,
  saveFeeRecord,
  savePatientRecord,
  saveSignature,
  signWithConsentLink,
} from "@/lib/consultorio/store";
import { GENERAL_CONSENT_VERSION } from "@/lib/consultorio/consents";
import type { ConsentKind, FeeItem, Patient, ToothMark } from "@/lib/consultorio/types";

export async function login(_prev: { error: string } | null, formData: FormData) {
  const expected = consultorioPassword();
  if (!expected) {
    return { error: "Falta configurar la clave del consultorio en el servidor." };
  }
  const password = String(formData.get("password") ?? "");
  if (!sameSecret(password, expected)) {
    return { error: "La clave no coincide." };
  }
  const jar = await cookies();
  jar.set(sessionCookie, await sessionToken(expected), sessionCookieOptions());
  redirect("/consultorio");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(sessionCookie);
  redirect("/consultorio/ingreso");
}

export async function createPatient(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existentes = await fichasConNombre(name);
  const conVisitas = existentes.filter((item) => (item.evolution ?? []).length > 0);
  const existente = conVisitas[0] ?? existentes[0];
  if (existente) redirect(`/consultorio/pacientes/${existente.id}`);
  const patient = await addPatientRecord(name);
  redirect(`/consultorio/pacientes/${patient.id}`);
}

export async function savePatientFields(input: unknown): Promise<{ error: string } | { ok: true }> {
  await requireSession();
  try {
    await savePatientRecord(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar." };
  }
  return { ok: true };
}

export async function guardarFirma(formData: FormData): Promise<{ error: string } | { patient: Patient }> {
  await requireSession();
  const patientId = String(formData.get("patientId") ?? "");
  const kind = String(formData.get("kind") ?? "") as ConsentKind;
  const scan = formData.get("scan");
  if (!(scan instanceof File) || scan.size === 0) {
    return { error: "No llegó la foto." };
  }
  try {
    const patient = await saveSignature(patientId, kind, scan, { source: "papel" });
    return { patient };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la foto." };
  }
}

export async function crearEnlaceFirma(patientId: string): Promise<{ error: string } | { url: string }> {
  await requireSession();
  try {
    const link = await createConsentLink(patientId);
    return { url: `/firmar/${link.token}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear el enlace." };
  }
}

export async function firmarConEnlace(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const token = String(formData.get("token") ?? "");
  const aclaracion = String(formData.get("aclaracion") ?? "").trim();
  const textVersion = String(formData.get("textVersion") ?? "");
  const scan = formData.get("scan");
  if (textVersion !== GENERAL_CONSENT_VERSION) {
    return { error: "Este enlace ya no sirve." };
  }
  if (!aclaracion) return { error: "Falta la aclaración." };
  if (!(scan instanceof File) || scan.size === 0) return { error: "Falta la firma." };
  try {
    await signWithConsentLink(token, aclaracion, scan);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la firma." };
  }
}

export async function firmarEnPantalla(formData: FormData): Promise<{ error: string } | { patient: Patient }> {
  await requireSession();
  const patientId = String(formData.get("patientId") ?? "");
  const kind = String(formData.get("kind") ?? "") as ConsentKind;
  const aclaracion = String(formData.get("aclaracion") ?? "").trim();
  const textVersion = String(formData.get("textVersion") ?? "");
  const scan = formData.get("scan");
  if (kind !== "general" || textVersion !== GENERAL_CONSENT_VERSION) {
    return { error: "Ese consentimiento no se puede firmar en pantalla." };
  }
  if (!aclaracion) return { error: "Falta la aclaración." };
  if (!(scan instanceof File) || scan.size === 0) return { error: "Falta la firma." };
  let teeth: Partial<Record<string, ToothMark>> = {};
  try {
    const parsed = JSON.parse(String(formData.get("teeth") ?? "{}"));
    if (parsed && typeof parsed === "object") teeth = parsed;
  } catch {
    teeth = {};
  }
  try {
    const patient = await saveSignature(patientId, kind, scan, {
      source: "pantalla",
      aclaracion,
      textVersion,
      teethSnapshot: teeth,
    });
    return { patient };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la firma." };
  }
}

export async function subirArchivoFicha(formData: FormData): Promise<{ error: string } | { patient: Patient }> {
  await requireSession();
  const patientId = String(formData.get("patientId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No llegó el archivo." };
  }
  try {
    const patient = await addChartFile(patientId, file);
    return { patient };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el archivo." };
  }
}

export async function quitarArchivoFicha(patientId: string, fileId: string): Promise<{ error: string } | { patient: Patient }> {
  await requireSession();
  try {
    const patient = await removeChartFile(patientId, fileId);
    return { patient };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo quitar el archivo." };
  }
}

export async function deletePatient(id: string) {
  await requireSession();
  await removePatientRecord(id);
  redirect("/consultorio/pacientes");
}

export async function saveOneFee(input: unknown): Promise<{ error: string } | { fee: FeeItem }> {
  await requireSession();
  try {
    const fee = await saveFeeRecord(input);
    return { fee };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el precio." };
  }
}
