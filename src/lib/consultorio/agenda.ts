import type { Collection } from "mongodb";
import {
  aWhatsapp,
  esDuracion,
  fechaCorta,
  horariosDeFin,
  esHorarioDeInicio,
  horariosDeInicio,
  mananaEnArgentina,
  minutos,
  sePisan,
  telefonoValido,
} from "./agenda-horario";
import { consultorioDb } from "./db";
import { isIsoDate } from "./fecha";
import { digitosTelefono } from "./nombre";
import { addPatientWithContact, fichasConNombre, setPatientContact } from "./store";

export type TurnoEstado = "confirmed" | "cancelled";

export type Turno = {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  dateKey: string;
  timeLocal: string;
  durationMinutes: number;
  reason: string;
  status: TurnoEstado;
  reminder: boolean;
  waAssignmentSentAt: string | null;
  waReminder24hSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Bloqueo = {
  id: string;
  dateKey: string;
  start: string;
  end: string;
  note: string;
};

export type TurnoNuevo = {
  patientId: string;
  name: string;
  phone: string;
  dateKey: string;
  timeLocal: string;
  durationMinutes: number;
  reason: string;
  reminder: boolean;
};

type PacienteCorto = { id: string; name: string; contact: string };

let ready: Promise<void> | undefined;

function plain<T extends { _id?: unknown }>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest;
}

async function turnos(): Promise<Collection<Turno>> {
  return (await consultorioDb()).collection<Turno>("turnos");
}

async function bloqueos(): Promise<Collection<Bloqueo>> {
  return (await consultorioDb()).collection<Bloqueo>("bloqueos");
}

async function prepare() {
  if (!ready) {
    ready = (async () => {
      const database = await consultorioDb();
      await Promise.all([
        database.collection("turnos").createIndex({ id: 1 }, { unique: true }),
        database.collection("turnos").createIndex({ dateKey: 1, timeLocal: 1 }),
        database.collection("bloqueos").createIndex({ id: 1 }, { unique: true }),
        database.collection("bloqueos").createIndex({ dateKey: 1 }),
      ]);
    })().catch((error: unknown) => {
      ready = undefined;
      throw error;
    });
  }
  return ready;
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

async function ocupados(dateKey: string) {
  await prepare();
  const [citas, huecos] = await Promise.all([
    (await turnos())
      .find({ dateKey, status: "confirmed" }, { projection: { _id: 0, timeLocal: 1, durationMinutes: 1 } })
      .toArray(),
    (await bloqueos()).find({ dateKey }, { projection: { _id: 0, start: 1, end: 1 } }).toArray(),
  ]);
  return { citas, huecos };
}

async function assertLibre(dateKey: string, start: string, end: string) {
  const startMinute = minutos(start);
  const endMinute = minutos(end);
  if (startMinute == null || endMinute == null || endMinute <= startMinute) {
    throw new Error("Revisá el horario.");
  }
  const { citas, huecos } = await ocupados(dateKey);
  const chocaTurno = citas.some((item) => {
    const other = minutos(item.timeLocal);
    if (other == null) return false;
    return sePisan(startMinute, endMinute, other, other + item.durationMinutes);
  });
  const chocaBloqueo = huecos.some((item) => {
    const otherStart = minutos(item.start);
    const otherEnd = minutos(item.end);
    if (otherStart == null || otherEnd == null) return false;
    return sePisan(startMinute, endMinute, otherStart, otherEnd);
  });
  if (chocaTurno || chocaBloqueo) throw new Error("Ese horario ya está ocupado.");
}

export async function buscarPacientes(query: string): Promise<PacienteCorto[]> {
  await prepare();
  const database = await consultorioDb();
  const collection = database.collection<PacienteCorto>("patients");
  const text = query.trim();
  if (text.length < 2) {
    const recent = await collection
      .find({}, { projection: { _id: 0, id: 1, name: 1, contact: 1 } })
      .sort({ updatedAt: -1 })
      .limit(6)
      .toArray();
    return recent.map((item) => plain(item));
  }
  const safe = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = await collection
    .find({ name: { $regex: safe, $options: "i" } }, { projection: { _id: 0, id: 1, name: 1, contact: 1 } })
    .limit(8)
    .toArray();
  return found.map((item) => plain(item));
}

export async function leerAgenda(from: string, to: string) {
  await prepare();
  const [citas, huecos] = await Promise.all([
    (await turnos()).find({ dateKey: { $gte: from, $lte: to } }, { projection: { _id: 0 } }).toArray(),
    (await bloqueos()).find({ dateKey: { $gte: from, $lte: to } }, { projection: { _id: 0 } }).toArray(),
  ]);
  const turnosLimpios = citas.map((item) => plain(item));
  const ids = [...new Set(turnosLimpios.map((item) => item.patientId))];
  if (ids.length > 0) {
    const database = await consultorioDb();
    const patients = await database
      .collection<{ id: string; name: string }>("patients")
      .find({ id: { $in: ids } }, { projection: { _id: 0, id: 1, name: 1 } })
      .toArray();
    const names = new Map(patients.map((item) => [item.id, item.name]));
    for (const turno of turnosLimpios) {
      const name = names.get(turno.patientId);
      if (name) turno.patientName = name;
    }
  }
  return { turnos: turnosLimpios, bloqueos: huecos.map((item) => plain(item)) };
}

export async function crearTurno(input: TurnoNuevo) {
  const dateKey = input.dateKey;
  const timeLocal = input.timeLocal;
  const duration = input.durationMinutes;
  if (!isIsoDate(dateKey) || !esHorarioDeInicio(timeLocal) || !esDuracion(duration)) {
    throw new Error("Revisá el día y la hora.");
  }
  const phone = clip(input.phone, 40);
  const reminder = input.reminder && telefonoValido(phone);
  if (input.reminder && !telefonoValido(phone)) throw new Error("Revisá el teléfono para el recordatorio.");
  const start = minutos(timeLocal);
  if (start == null) throw new Error("Revisá el horario.");
  await assertLibre(dateKey, timeLocal, minutosAHora(start + duration));

  let patientId = input.patientId.trim();
  let patientName = clip(input.name, 120);
  if (!patientId) {
    if (patientName.length < 2) throw new Error("Completá el nombre.");
    const mismas = await fichasConNombre(patientName);
    if (mismas.length > 1) throw new Error("Hay más de una ficha con ese nombre. Elegí cuál es.");
    if (mismas.length === 1) {
      const actual = mismas[0];
      const nuevo = digitosTelefono(phone);
      const guardado = digitosTelefono(actual.contact);
      if (nuevo && guardado && nuevo !== guardado) {
        throw new Error("Ya existe esta ficha con otro teléfono. Elegila en la lista.");
      }
      patientId = actual.id;
      patientName = actual.name;
      if (nuevo && !guardado) await setPatientContact(patientId, phone);
    } else {
      const patient = await addPatientWithContact(patientName, phone);
      patientId = patient.id;
      patientName = patient.name;
    }
  } else {
    const database = await consultorioDb();
    const patient = await database
      .collection<{ id: string; name: string }>("patients")
      .findOne({ id: patientId }, { projection: { _id: 0, id: 1, name: 1 } });
    if (!patient) throw new Error("No encontré esta ficha.");
    patientName = patient.name;
    if (phone) await setPatientContact(patientId, phone);
  }

  const now = new Date().toISOString();
  const turno: Turno = {
    id: crypto.randomUUID(),
    patientId,
    patientName,
    phone,
    dateKey,
    timeLocal,
    durationMinutes: duration,
    reason: clip(input.reason, 180) || "Consulta",
    status: "confirmed",
    reminder,
    waAssignmentSentAt: null,
    waReminder24hSentAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await (await turnos()).insertOne({ ...turno });
  const whatsappEnviado = reminder ? await enviarAsignacion(turno) : true;
  if (whatsappEnviado && reminder) {
    turno.waAssignmentSentAt = new Date().toISOString();
    await (await turnos()).updateOne({ id: turno.id }, { $set: { waAssignmentSentAt: turno.waAssignmentSentAt } });
  }
  return { turno, whatsappEnviado };
}

async function enviarAsignacion(turno: Turno) {
  const config = configTwilio(process.env.TWILIO_ASSIGNMENT_CONTENT_SID);
  if (!config) return false;
  try {
    await enviarPlantilla({
      ...config,
      phone: turno.phone,
      nombre: turno.patientName,
      fecha: fechaCorta(turno.dateKey),
      hora: turno.timeLocal,
    });
    return true;
  } catch {
    return false;
  }
}

function minutosAHora(total: number) {
  const day = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(day / 60)).padStart(2, "0")}:${String(day % 60).padStart(2, "0")}`;
}

export async function cancelarTurno(id: string) {
  await prepare();
  const result = await (await turnos()).updateOne(
    { id, status: "confirmed" },
    { $set: { status: "cancelled", updatedAt: new Date().toISOString() } },
  );
  if (result.matchedCount === 0) throw new Error("No encontré este turno.");
}

export async function crearBloqueo(input: { dateKey: string; start: string; end: string; note: string }) {
  if (!isIsoDate(input.dateKey) || !horariosDeInicio().includes(input.start) || !horariosDeFin().includes(input.end)) {
    throw new Error("Revisá el día y el horario.");
  }
  const start = minutos(input.start);
  const end = minutos(input.end);
  if (start == null || end == null || end <= start) throw new Error("El horario de fin tiene que ser después.");
  await assertLibre(input.dateKey, input.start, input.end);
  const bloqueo: Bloqueo = {
    id: crypto.randomUUID(),
    dateKey: input.dateKey,
    start: input.start,
    end: input.end,
    note: clip(input.note, 180),
  };
  await (await bloqueos()).insertOne({ ...bloqueo });
  return bloqueo;
}

export async function quitarBloqueo(id: string) {
  await prepare();
  await (await bloqueos()).deleteOne({ id });
}

function configTwilio(contentSidValue: string | undefined) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const contentSid = contentSidValue?.trim() ?? "";
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() ?? "";
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim() ?? "";
  if (!accountSid || !authToken || !contentSid || (!messagingServiceSid && !from)) return null;
  return { accountSid, authToken, contentSid, messagingServiceSid, from };
}

export async function enviarRecordatorios(now = new Date()) {
  const config = configTwilio(process.env.TWILIO_REMINDER_CONTENT_SID);
  if (!config) {
    throw new Error("Falta configurar Twilio para el recordatorio.");
  }

  await prepare();
  const dateKey = mananaEnArgentina(now);
  const collection = await turnos();
  const pendientes = await collection
    .find(
      {
        dateKey,
        status: "confirmed",
        reminder: true,
        waReminder24hSentAt: null,
      },
      { projection: { _id: 0 } },
    )
    .toArray();

  let sent = 0;
  let errors = 0;
  for (const turno of pendientes) {
    if (!telefonoValido(turno.phone)) {
      await collection.updateOne({ id: turno.id }, { $set: { reminder: false } });
      continue;
    }
    const claimedAt = new Date().toISOString();
    const claim = await collection.findOneAndUpdate(
      { id: turno.id, status: "confirmed", reminder: true, waReminder24hSentAt: null },
      { $set: { waReminder24hSentAt: claimedAt } },
      { returnDocument: "before" },
    );
    if (!claim) continue;
    try {
      await enviarPlantilla({
        ...config,
        phone: turno.phone,
        nombre: turno.patientName,
        fecha: fechaCorta(turno.dateKey),
        hora: turno.timeLocal,
      });
      sent += 1;
    } catch {
      errors += 1;
      await collection.updateOne(
        { id: turno.id, waReminder24hSentAt: claimedAt },
        { $set: { waReminder24hSentAt: null } },
      );
    }
  }
  return { dateKey, sent, errors };
}

async function enviarPlantilla(input: {
  accountSid: string;
  authToken: string;
  contentSid: string;
  messagingServiceSid: string;
  from: string;
  phone: string;
  nombre: string;
  fecha: string;
  hora: string;
}) {
  const body = new URLSearchParams({
    To: aWhatsapp(input.phone),
    ContentSid: input.contentSid,
    ContentVariables: JSON.stringify({
      "1": input.nombre,
      "2": input.fecha,
      "3": input.hora,
    }),
  });
  if (input.messagingServiceSid) body.set("MessagingServiceSid", input.messagingServiceSid);
  else body.set("From", input.from.startsWith("whatsapp:") ? input.from : `whatsapp:+${input.from.replace(/\D/g, "")}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${input.accountSid}:${input.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!response.ok) {
    throw new Error("Twilio no envió el mensaje.");
  }
}
