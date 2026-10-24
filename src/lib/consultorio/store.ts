import { Binary, type Collection } from "mongodb";
import { consultorioDb } from "./db";
import { GENERAL_CONSENT_VERSION } from "./consents";
import { fechaDeInicio, isIsoDate, todayInArgentina } from "./fecha";
import { claveNombre } from "./nombre";
import { seedFees } from "./fees";
import {
  allTeeth,
  toothMarks,
  type ConsentKind,
  type Evolution,
  type FeeItem,
  type ChartFile,
  type Patient,
  type ConsentSource,
  type SignedConsent,
  type Store,
  type ToothMark,
} from "./types";

type FeeDoc = FeeItem & { order: number };
type Adjunto = { id: string; mime: string; data: Binary };

let writeChain: Promise<unknown> = Promise.resolve();
let prepared: Promise<void> | undefined;

function turn<T>(task: () => Promise<T>) {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

const marks = new Set<string>(toothMarks.map((mark) => mark.id));
const teeth = new Set<string>(allTeeth);
const kinds = new Set<ConsentKind>(["general", "implante", "cirugia", "endodoncia"]);

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function toothMapOf(input: unknown): Patient["teeth"] {
  const toothMap: Patient["teeth"] = {};
  if (!input || typeof input !== "object") return toothMap;
  for (const [tooth, mark] of Object.entries(input)) {
    if (teeth.has(tooth) && marks.has(String(mark)) && mark !== "sana") {
      toothMap[tooth] = mark as ToothMark;
    }
  }
  return toothMap;
}

function consentOf(item: Partial<SignedConsent>): SignedConsent | null {
  if (!item.kind || !kinds.has(item.kind)) return null;
  const signedOn = clip(item.signedOn, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(signedOn)) return null;
  const consent: SignedConsent = {
    id: clip(item.id, 80) || crypto.randomUUID(),
    kind: item.kind,
    signedOn,
  };
  if (item.fileId) consent.fileId = clip(item.fileId, 80);
  if (item.fileName) consent.fileName = clip(item.fileName, 180);
  if (item.mime) consent.mime = clip(item.mime, 80);
  const aclaracion = clip(item.aclaracion, 120);
  if (aclaracion) consent.aclaracion = aclaracion;
  const textVersion = clip(item.textVersion, 40);
  if (textVersion) consent.textVersion = textVersion;
  if (item.source === "pantalla" || item.source === "papel") consent.source = item.source;
  if (item.signedAt && !Number.isNaN(Date.parse(clip(item.signedAt, 40)))) {
    consent.signedAt = new Date(item.signedAt).toISOString();
  }
  if (item.teethSnapshot && typeof item.teethSnapshot === "object") {
    consent.teethSnapshot = toothMapOf(item.teethSnapshot);
  }
  return consent;
}

function money(value: unknown) {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > 100_000_000) return null;
  return Math.round(number);
}

export function emptyPatient(name: string): Patient {
  return {
    id: crypto.randomUUID(),
    name: clip(name, 120),
    document: "",
    birthDate: "",
    contact: "",
    address: "",
    familyContact: "",
    background: "",
    reason: "",
    startedOn: todayInArgentina(),
    evolution: [],
    teeth: {},
    consents: [],
    files: [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeVisits(stored: Evolution[], incoming: Evolution[], today: string) {
  const past = stored.filter((note) => note.date < today).map((note) => ({ ...note }));
  const pastIds = new Set(past.map((note) => note.id));
  const fromToday = incoming.filter((note) => note.date >= today && !pastIds.has(note.id));
  const room = Math.max(0, 200 - past.length);
  return [...fromToday.slice(0, room), ...past].sort((a, b) => b.date.localeCompare(a.date));
}

export function sanitizePatient(input: unknown): Patient | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<Patient>;
  const name = clip(raw.name, 120);
  if (!name || !raw.id) return null;

  const evolution = Array.isArray(raw.evolution)
    ? raw.evolution.slice(0, 200).flatMap((note) => {
        if (!note || typeof note !== "object") return [];
        const text = clip(note.text, 4000);
        const date = clip(note.date, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
        return [{ id: clip(note.id, 80) || crypto.randomUUID(), date, text }];
      })
    : [];

  const toothMap = toothMapOf(raw.teeth);

  const consents: SignedConsent[] = Array.isArray(raw.consents)
    ? raw.consents.slice(0, 50).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const consent = consentOf(item);
        return consent ? [consent] : [];
      })
    : [];

  return {
    id: clip(raw.id, 80),
    name,
    document: clip(raw.document, 32),
    birthDate: isIsoDate(clip(raw.birthDate, 10)) ? clip(raw.birthDate, 10) : "",
    contact: clip(raw.contact, 200),
    address: clip(raw.address, 200),
    familyContact: clip(raw.familyContact, 200),
    background: clip(raw.background, 8000),
    reason: clip(raw.reason, 4000),
    startedOn: fechaDeInicio({ ...raw, evolution }),
    evolution,
    teeth: toothMap,
    consents,
    files: [],
    updatedAt: new Date().toISOString(),
  };
}

export function sanitizeFees(input: unknown): FeeItem[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 400).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const name = clip(item.name, 180);
    if (!name) return [];
    return [
      {
        id: clip(item.id, 80) || crypto.randomUUID(),
        code: clip(item.code, 20),
        chapter: clip(item.chapter, 80) || "Consultorio",
        name,
        minimum: money(item.minimum),
        price: money(item.price),
        offered: item.offered !== false,
      },
    ];
  });
}

function plain<T extends { _id?: unknown }>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest;
}

async function patients(): Promise<Collection<Patient>> {
  return (await consultorioDb()).collection<Patient>("patients");
}

async function fees(): Promise<Collection<FeeDoc>> {
  return (await consultorioDb()).collection<FeeDoc>("fees");
}

async function adjuntos(): Promise<Collection<Adjunto>> {
  return (await consultorioDb()).collection<Adjunto>("adjuntos");
}

type ConsentLinkDoc = {
  token: string;
  patientId: string;
  expiresAt: string;
  usedAt: string | null;
};

async function consentLinks(): Promise<Collection<ConsentLinkDoc>> {
  return (await consultorioDb()).collection<ConsentLinkDoc>("consent_links");
}

function esToken(token: string) {
  return /^[A-Za-z0-9_-]{32,80}$/.test(token);
}

function enlaceVigente(link: ConsentLinkDoc | null): link is ConsentLinkDoc {
  if (!link || link.usedAt) return false;
  const expires = Date.parse(link.expiresAt);
  return Number.isFinite(expires) && expires > Date.now();
}

async function prepare() {
  if (!prepared) {
    prepared = (async () => {
      const database = await consultorioDb();
      await Promise.all([
        database.collection("patients").createIndex({ id: 1 }, { unique: true }),
        database.collection("fees").createIndex({ id: 1 }, { unique: true }),
        database.collection("adjuntos").createIndex({ id: 1 }, { unique: true }),
        database.collection("consent_links").createIndex({ token: 1 }, { unique: true }),
        database.collection("consent_links").createIndex({ patientId: 1 }),
      ]);
      const fees = database.collection<FeeDoc>("fees");
      const count = await fees.countDocuments({}, { limit: 1 });
      if (count > 0) return;
      const seed = seedFees();
      if (seed.length === 0) return;
      await fees.bulkWrite(
        seed.map((fee, order) => ({
          updateOne: {
            filter: { id: fee.id },
            update: { $setOnInsert: { ...fee, order } },
            upsert: true,
          },
        })),
      );
    })().catch((error: unknown) => {
      prepared = undefined;
      throw error;
    });
  }
  return prepared;
}

export async function readStore(): Promise<Store> {
  await prepare();
  const [patientDocs, feeDocs] = await Promise.all([
    (await patients()).find({}, { projection: { _id: 0 } }).toArray(),
    (await fees()).find({}, { projection: { _id: 0 } }).sort({ order: 1, code: 1 }).toArray(),
  ]);
  return {
    patients: patientDocs.map((item) => plain(item)),
    fees: feeDocs.map(({ order: _order, ...fee }) => plain(fee)),
  };
}

async function findPatient(id: string) {
  const doc = await (await patients()).findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return null;
  const patient = plain(doc);
  return { ...patient, consents: patient.consents ?? [], files: patient.files ?? [] };
}

export async function fichasConNombre(name: string) {
  await prepare();
  const clave = claveNombre(name);
  if (clave.length < 2) return [];
  const docs = await (await patients()).find({}, { projection: { _id: 0 } }).toArray();
  return docs.map((item) => plain(item)).filter((item) => claveNombre(item.name) === clave);
}

const chartMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function acceptedChartFile(file: File) {
  if (file.size <= 0 || file.size > 4 * 1024 * 1024) {
    throw new Error("El archivo tiene que pesar menos de 4 MB.");
  }
  const name = file.name.toLowerCase();
  const fromName = name.endsWith(".png")
    ? "image/png"
    : name.endsWith(".webp")
      ? "image/webp"
      : name.endsWith(".pdf")
        ? "application/pdf"
        : name.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : name.endsWith(".doc")
            ? "application/msword"
            : name.endsWith(".jpg") || name.endsWith(".jpeg")
              ? "image/jpeg"
              : "";
  const mime = chartMimes.has(file.type) ? file.type : fromName;
  if (!mime) throw new Error("El archivo tiene que ser una imagen, un PDF o un Word.");
  return mime;
}

function acceptedUpload(file: File) {
  if (file.size <= 0 || file.size > 4 * 1024 * 1024) {
    throw new Error("El archivo tiene que pesar menos de 4 MB.");
  }
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  let mime = file.type;
  if (!mime) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".png")) mime = "image/png";
    else if (name.endsWith(".webp")) mime = "image/webp";
    else if (name.endsWith(".pdf")) mime = "application/pdf";
    else mime = "image/jpeg";
  }
  if (!allowed.has(mime)) {
    throw new Error("La foto tiene que ser JPG, PNG o PDF.");
  }
  return mime;
}

function isFileId(fileId: string) {
  return /^[0-9a-f-]{36}$/i.test(fileId);
}

async function saveUpload(file: File, accept: (file: File) => string = acceptedUpload) {
  const mime = accept(file);
  const id = crypto.randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  await (await adjuntos()).insertOne({ id, mime, data: new Binary(bytes) });
  return { fileId: id, fileName: clip(file.name, 180), mime };
}

export async function readUpload(fileId: string) {
  if (!isFileId(fileId)) return null;
  await prepare();
  const doc = await (await adjuntos()).findOne({ id: fileId }, { projection: { data: 1 } });
  if (!doc?.data) return null;
  return Buffer.from(doc.data.value());
}

async function removeUploads(fileIds: string[]) {
  const ids = fileIds.filter(isFileId);
  if (ids.length === 0) return;
  await (await adjuntos()).deleteMany({ id: { $in: ids } });
}

export function addPatientRecord(name: string) {
  return turn(async () => {
    await prepare();
    const patient = emptyPatient(name);
    if (!patient.name) throw new Error("Completá el nombre.");
    await (await patients()).insertOne({ ...patient });
    return patient;
  });
}

export function addPatientWithContact(name: string, contact: string) {
  return turn(async () => {
    await prepare();
    const patient = emptyPatient(name);
    patient.contact = clip(contact, 200);
    if (!patient.name) throw new Error("Completá el nombre.");
    await (await patients()).insertOne({ ...patient });
    return patient;
  });
}

export async function setPatientContact(id: string, contact: string) {
  await prepare();
  await (await patients()).updateOne(
    { id },
    { $set: { contact: clip(contact, 200), updatedAt: new Date().toISOString() } },
  );
}

export function savePatientRecord(input: unknown) {
  return turn(async () => {
    await prepare();
    const incoming = sanitizePatient(input);
    if (!incoming) throw new Error("Completá el nombre.");
    const current = await findPatient(incoming.id);
    if (!current) throw new Error("No encontré esta ficha.");
    const latest = await findPatient(incoming.id);
    const next: Patient = {
      ...incoming,
      startedOn: isIsoDate(current.startedOn) ? current.startedOn : incoming.startedOn,
      evolution: mergeVisits(current.evolution ?? [], incoming.evolution, todayInArgentina()),
      consents: latest?.consents ?? current.consents,
      files: latest?.files ?? current.files ?? [],
    };
    await (await patients()).replaceOne({ id: next.id }, { ...next });
    return next;
  });
}

export function saveFeeRecord(input: unknown) {
  return turn(async () => {
    await prepare();
    const fee = sanitizeFees([input])[0];
    if (!fee) throw new Error("Revisá el nombre de la práctica.");
    const collection = await fees();
    const current = await collection.findOne({ id: fee.id }, { projection: { order: 1 } });
    const order =
      current?.order ?? ((await collection.find().sort({ order: -1 }).limit(1).next())?.order ?? -1) + 1;
    await collection.updateOne({ id: fee.id }, { $set: { ...fee, order } }, { upsert: true });
    return fee;
  });
}

async function writeSignature(
  patientId: string,
  kind: ConsentKind,
  file: File,
  extra: {
    source: ConsentSource;
    aclaracion?: string;
    textVersion?: string;
    teethSnapshot?: Patient["teeth"];
  },
) {
  const uploaded = await saveUpload(file);
  const patient = await findPatient(patientId);
  if (!patient) throw new Error("No encontré esta ficha.");
  if (!kinds.has(kind)) throw new Error("Esa práctica no tiene hoja.");
  const previous = patient.consents.find((item) => item.kind === kind);
  if (previous?.fileId) await removeUploads([previous.fileId]);
  const now = new Date().toISOString();
  const consent: SignedConsent = {
    id: previous?.id ?? crypto.randomUUID(),
    kind,
    signedOn: todayInArgentina(),
    signedAt: now,
    source: extra.source,
    ...uploaded,
  };
  const aclaracion = clip(extra.aclaracion, 120);
  if (aclaracion) consent.aclaracion = aclaracion;
  const textVersion = clip(extra.textVersion, 40);
  if (textVersion) consent.textVersion = textVersion;
  if (extra.source === "pantalla") {
    consent.teethSnapshot = toothMapOf(extra.teethSnapshot ?? {});
  }
  const next: Patient = {
    ...patient,
    consents: [...patient.consents.filter((item) => item.kind !== kind), consent],
    updatedAt: now,
  };
  await (await patients()).replaceOne({ id: patientId }, { ...next });
  return next;
}

export function saveSignature(
  patientId: string,
  kind: ConsentKind,
  file: File,
  extra: {
    source: ConsentSource;
    aclaracion?: string;
    textVersion?: string;
    teethSnapshot?: Patient["teeth"];
  } = { source: "papel" },
) {
  return turn(async () => {
    await prepare();
    return writeSignature(patientId, kind, file, extra);
  });
}

export function createConsentLink(patientId: string) {
  return turn(async () => {
    await prepare();
    const patient = await findPatient(patientId);
    if (!patient) throw new Error("No encontré esta ficha.");
    const links = await consentLinks();
    await links.deleteMany({ patientId });
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Buffer.from(bytes).toString("base64url");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await links.insertOne({ token, patientId, expiresAt, usedAt: null });
    return { token, expiresAt };
  });
}

export async function activeConsentLink(patientId: string) {
  await prepare();
  const link = await (await consentLinks()).findOne({ patientId, usedAt: null }, { projection: { _id: 0 } });
  if (!enlaceVigente(link)) return null;
  return link.token;
}

export async function consentLinkView(token: string) {
  if (!esToken(token)) return null;
  await prepare();
  const link = await (await consentLinks()).findOne({ token }, { projection: { _id: 0 } });
  if (!enlaceVigente(link)) return null;
  const patient = await findPatient(link.patientId);
  if (!patient) return null;
  return { name: patient.name, teeth: patient.teeth ?? {} };
}

export function signWithConsentLink(token: string, aclaracion: string, file: File) {
  return turn(async () => {
    await prepare();
    if (!esToken(token)) throw new Error("Este enlace ya no sirve.");
    const links = await consentLinks();
    const link = await links.findOne({ token });
    if (!enlaceVigente(link)) throw new Error("Este enlace ya no sirve.");
    const patient = await findPatient(link.patientId);
    if (!patient) throw new Error("Este enlace ya no sirve.");
    await writeSignature(patient.id, "general", file, {
      source: "pantalla",
      aclaracion,
      textVersion: GENERAL_CONSENT_VERSION,
      teethSnapshot: patient.teeth ?? {},
    });
    await links.updateOne({ token, usedAt: null }, { $set: { usedAt: new Date().toISOString() } });
  });
}

export function addChartFile(patientId: string, file: File) {
  return turn(async () => {
    await prepare();
    const patient = await findPatient(patientId);
    if (!patient) throw new Error("No encontré esta ficha.");
    if (patient.files.length >= 40) throw new Error("Esta ficha ya tiene muchos archivos.");
    const uploaded = await saveUpload(file, acceptedChartFile);
    const chartFile: ChartFile = {
      id: crypto.randomUUID(),
      fileId: uploaded.fileId,
      fileName: uploaded.fileName,
      mime: uploaded.mime,
      addedOn: todayInArgentina(),
    };
    const next: Patient = {
      ...patient,
      files: [chartFile, ...patient.files],
      updatedAt: new Date().toISOString(),
    };
    await (await patients()).replaceOne({ id: patientId }, { ...next });
    return next;
  });
}

export function removeChartFile(patientId: string, fileId: string) {
  return turn(async () => {
    await prepare();
    const patient = await findPatient(patientId);
    if (!patient) throw new Error("No encontré esta ficha.");
    const target = patient.files.find((item) => item.id === fileId);
    if (!target) throw new Error("No encontré este archivo.");
    await removeUploads([target.fileId]);
    const next: Patient = {
      ...patient,
      files: patient.files.filter((item) => item.id !== fileId),
      updatedAt: new Date().toISOString(),
    };
    await (await patients()).replaceOne({ id: patientId }, { ...next });
    return next;
  });
}

export function removePatientRecord(id: string) {
  return turn(async () => {
    await prepare();
    const current = await findPatient(id);
    if (current) {
      await removeUploads([
        ...current.consents.flatMap((item) => (item.fileId ? [item.fileId] : [])),
        ...current.files.map((item) => item.fileId),
      ]);
    }
    await (await patients()).deleteOne({ id });
    await (await consentLinks()).deleteMany({ patientId: id });
  });
}
