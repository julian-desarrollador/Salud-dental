import { Binary, type Collection } from "mongodb";
import { consultorioDb } from "./db";
import {
  HOJAS_EDITABLES,
  numeroDeVersion,
  sanitizeNotas,
  sanitizeTexto,
  sePuedeEnviar,
  textoDeFabrica,
  type HojaEditable,
  type TextoConsentimiento,
  type TextoVigente,
} from "./consents";
import { edadEscrita, fechaDeInicio, isIsoDate, todayInArgentina } from "./fecha";
import { claveNombre } from "./nombre";
import { seedFees } from "./fees";
import { preguntasIniciales, sanitizePreguntas, sanitizeRespuestas } from "./preguntas";
import { catalogoInicial, piezasDe, piezasDesdeLegado, sanitizeCatalogo, sanitizePiezas, sanitizePlan } from "./odontograma";
import { sanitizePrecios, sanitizePresupuestos } from "./presupuesto";
import { PLANTILLAS_INICIALES, sanitizeMensajes, type MensajesTurno } from "./avisos-turno";
import {
  allTeeth,
  toothMarks,
  type ConsentKind,
  type Evolution,
  type FeeItem,
  type ChartFile,
  type Patient,
  type Piezas,
  type PreguntaMedica,
  type PrestacionCatalogo,
  type ConsentSource,
  type Firmante,
  type SignedConsent,
  type Store,
  type ToothMark,
} from "./types";

type FeeDoc = FeeItem & { order: number };

const MIGRACION_PRECIOS = "precios-sin-colegio";
type Adjunto = { id: string; mime: string; data: Binary };
type PreguntasDoc = { id: string; questions: PreguntaMedica[]; updatedAt: string };
type CatalogoDoc = { id: string; items: PrestacionCatalogo[]; updatedAt: string };
type MensajesDoc = MensajesTurno & { id: string; updatedAt: string };
type TextoDoc = TextoVigente & { kind: HojaEditable; updatedAt: string };
type ToothMap = NonNullable<Patient["teeth"]>;

const LISTA_PREGUNTAS = "principal";
const LISTA_PRESTACIONES = "principal";
const MENSAJES_TURNO = "avisos-turno";

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
const kinds = new Set<ConsentKind>(["general", "ortopedia", "ortodoncia", "endodoncia", "implante", "cirugia"]);

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function toothMapOf(input: unknown): ToothMap {
  const toothMap: ToothMap = {};
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
  if (item.piezasSnapshot && typeof item.piezasSnapshot === "object") {
    consent.piezasSnapshot = sanitizePiezas(item.piezasSnapshot);
  }
  return consent;
}

export function emptyPatient(name: string): Patient {
  return {
    id: crypto.randomUUID(),
    name: clip(name, 120),
    document: "",
    birthDate: "",
    age: "",
    ageSetOn: "",
    contact: "",
    address: "",
    familyContact: "",
    background: "",
    medicalAnswers: {},
    reason: "",
    startedOn: todayInArgentina(),
    evolution: [],
    piezas: {},
    plan: [],
    presupuestos: [],
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

  const piezas = sanitizePiezas(raw.piezas ?? piezasDesdeLegado(raw.teeth));
  const plan = sanitizePlan(raw.plan);

  const consents: SignedConsent[] = Array.isArray(raw.consents)
    ? raw.consents.slice(0, 50).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const consent = consentOf(item);
        return consent ? [consent] : [];
      })
    : [];

  const age = edadEscrita(raw.age);
  const ageSetOn = clip(raw.ageSetOn, 10);

  return {
    id: clip(raw.id, 80),
    name,
    document: clip(raw.document, 32),
    birthDate: isIsoDate(clip(raw.birthDate, 10)) ? clip(raw.birthDate, 10) : "",
    age,
    ageSetOn: age && isIsoDate(ageSetOn) ? ageSetOn : "",
    contact: clip(raw.contact, 200),
    address: clip(raw.address, 200),
    familyContact: clip(raw.familyContact, 200),
    background: clip(raw.background, 8000),
    medicalAnswers: sanitizeRespuestas(raw.medicalAnswers),
    reason: clip(raw.reason, 4000),
    startedOn: fechaDeInicio({ ...raw, evolution }),
    evolution,
    piezas,
    plan,
    presupuestos: sanitizePresupuestos(raw.presupuestos),
    consents,
    files: [],
    updatedAt: new Date().toISOString(),
  };
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

async function listasDePreguntas(): Promise<Collection<PreguntasDoc>> {
  return (await consultorioDb()).collection<PreguntasDoc>("preguntas_medicas");
}

async function catalogos(): Promise<Collection<CatalogoDoc>> {
  return (await consultorioDb()).collection<CatalogoDoc>("prestaciones_odontograma");
}

async function mensajesWhatsapp(): Promise<Collection<MensajesDoc>> {
  return (await consultorioDb()).collection<MensajesDoc>("mensajes_whatsapp");
}

type ConsentLinkDoc = {
  token: string;
  patientId: string;
  /** Hoja del enlace. Los enlaces viejos no lo tienen: son del consentimiento general. */
  kind?: ConsentKind;
  /** Lo que Jesica escribió en los espacios de la hoja antes de mandarla. */
  notas?: { label: string; texto: string }[];
  expiresAt: string;
  usedAt: string | null;
};

type HojaDeEnlace = "general" | "ortodoncia" | "ortopedia";

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
        database.collection("preguntas_medicas").createIndex({ id: 1 }, { unique: true }),
        database.collection("prestaciones_odontograma").createIndex({ id: 1 }, { unique: true }),
        database.collection("mensajes_whatsapp").createIndex({ id: 1 }, { unique: true }),
        database.collection("textos_consentimiento").createIndex({ kind: 1 }, { unique: true }),
      ]);
      await Promise.all([
        database.collection<PreguntasDoc>("preguntas_medicas").updateOne(
          { id: LISTA_PREGUNTAS },
          { $setOnInsert: { questions: preguntasIniciales, updatedAt: new Date().toISOString() } },
          { upsert: true },
        ),
        database.collection<CatalogoDoc>("prestaciones_odontograma").updateOne(
          { id: LISTA_PRESTACIONES },
          { $setOnInsert: { items: catalogoInicial, updatedAt: new Date().toISOString() } },
          { upsert: true },
        ),
        database.collection<MensajesDoc>("mensajes_whatsapp").updateOne(
          { id: MENSAJES_TURNO },
          { $setOnInsert: { ...PLANTILLAS_INICIALES, updatedAt: new Date().toISOString() } },
          { upsert: true },
        ),
      ]);
      // La lista del Colegio ya no se siembra. Una sola vez, se borran las filas del Colegio
      // que Jesica no tocó (precio igual al mínimo) o marcó como "No la hago".
      const migraciones = database.collection<{ id: string; doneAt: string }>("migraciones");
      if (!(await migraciones.findOne({ id: MIGRACION_PRECIOS }))) {
        const colegio = seedFees();
        if (colegio.length > 0) {
          await database.collection("fees").deleteMany({
            $or: colegio.map((fee) => ({ id: fee.id, $or: [{ price: fee.minimum }, { offered: false }] })),
          });
        }
        await migraciones.updateOne(
          { id: MIGRACION_PRECIOS },
          { $setOnInsert: { doneAt: new Date().toISOString() } },
          { upsert: true },
        );
      }
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
    (await fees()).find({}, { projection: { _id: 0 } }).sort({ order: 1, id: 1 }).toArray(),
  ]);
  return {
    patients: patientDocs.map((item) => plain(item)),
    fees: feeDocs.map((fee) => ({ id: fee.id, chapter: fee.chapter ?? "", name: fee.name, price: fee.price ?? null })),
  };
}

async function findPatient(id: string) {
  const doc = await (await patients()).findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return null;
  const patient = plain(doc);
  return {
    ...patient,
    medicalAnswers: patient.medicalAnswers ?? {},
    consents: patient.consents ?? [],
    files: patient.files ?? [],
  };
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

export async function readPreguntasMedicas(): Promise<PreguntaMedica[]> {
  await prepare();
  const doc = await (await listasDePreguntas()).findOne({ id: LISTA_PREGUNTAS }, { projection: { _id: 0 } });
  return doc?.questions ?? [];
}

export function savePreguntasRecord(input: unknown) {
  return turn(async () => {
    await prepare();
    const questions = sanitizePreguntas(input);
    await (await listasDePreguntas()).updateOne(
      { id: LISTA_PREGUNTAS },
      { $set: { questions, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return questions;
  });
}

export async function readCatalogoOdontograma(): Promise<PrestacionCatalogo[]> {
  await prepare();
  const doc = await (await catalogos()).findOne({ id: LISTA_PRESTACIONES }, { projection: { _id: 0 } });
  return doc?.items ?? [];
}

export function saveCatalogoRecord(input: unknown) {
  return turn(async () => {
    await prepare();
    const items = sanitizeCatalogo(input);
    await (await catalogos()).updateOne(
      { id: LISTA_PRESTACIONES },
      { $set: { items, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return items;
  });
}

/** Guarda la lista de precios completa, en orden, y borra las filas que ya no están. */
export function saveFeeList(input: unknown) {
  return turn(async () => {
    await prepare();
    const items = sanitizePrecios(input);
    const collection = await fees();
    if (items.length > 0) {
      await collection.bulkWrite(
        items.map((item, order) => ({
          replaceOne: { filter: { id: item.id }, replacement: { ...item, order }, upsert: true },
        })),
      );
    }
    await collection.deleteMany({ id: { $nin: items.map((item) => item.id) } });
    return items;
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
    piezasSnapshot?: Piezas;
    firmante?: Firmante;
    dniFirmante?: string;
    notas?: { label: string; texto: string }[];
    texto?: TextoConsentimiento;
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
  if (extra.source === "pantalla" && extra.piezasSnapshot) {
    consent.piezasSnapshot = sanitizePiezas(extra.piezasSnapshot);
  }
  if (extra.firmante === "paciente" || extra.firmante === "representante") consent.firmante = extra.firmante;
  const dniFirmante = clip(extra.dniFirmante, 30);
  if (dniFirmante) consent.dniFirmante = dniFirmante;
  const notas = sanitizeNotas(kind, extra.notas);
  if (notas.length > 0) consent.notas = notas;
  const texto = extra.texto ? sanitizeTexto(extra.texto) : null;
  if (texto) consent.texto = texto;
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
    piezasSnapshot?: Piezas;
  } = { source: "papel" },
) {
  return turn(async () => {
    await prepare();
    return writeSignature(patientId, kind, file, extra);
  });
}

function hojaDelEnlace(link: ConsentLinkDoc): HojaDeEnlace {
  return link.kind === "ortodoncia" || link.kind === "ortopedia" ? link.kind : "general";
}

/** Filtro de los enlaces de una hoja; los viejos sin hoja cuentan como del general. */
function enlacesDeLaHoja(patientId: string, kind: HojaDeEnlace) {
  return kind === "general"
    ? { patientId, $or: [{ kind: "general" as const }, { kind: { $exists: false } }] }
    : { patientId, kind };
}

export function createConsentLink(patientId: string, kind: string = "general", notasInput: unknown = []) {
  return turn(async () => {
    await prepare();
    if (!sePuedeEnviar(kind)) throw new Error("Esa hoja no se puede mandar por WhatsApp.");
    const hoja = kind as HojaDeEnlace;
    const patient = await findPatient(patientId);
    if (!patient) throw new Error("No encontré esta ficha.");
    const links = await consentLinks();
    await links.deleteMany(enlacesDeLaHoja(patientId, hoja));
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Buffer.from(bytes).toString("base64url");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const notas = sanitizeNotas(hoja, notasInput);
    await links.insertOne({ token, patientId, kind: hoja, notas, expiresAt, usedAt: null });
    return { token, expiresAt };
  });
}

/** Enlaces vigentes de la ficha, por hoja, con lo que Jesica escribió al mandarlos. */
export async function activeConsentLinks(patientId: string) {
  await prepare();
  const docs = await (await consentLinks()).find({ patientId, usedAt: null }, { projection: { _id: 0 } }).toArray();
  const vigentes: Partial<Record<HojaDeEnlace, { url: string; notas: { label: string; texto: string }[] }>> = {};
  for (const link of docs) {
    if (!enlaceVigente(link)) continue;
    vigentes[hojaDelEnlace(link)] = { url: `/firmar/${link.token}`, notas: link.notas ?? [] };
  }
  return vigentes;
}

export async function consentLinkView(token: string) {
  if (!esToken(token)) return null;
  await prepare();
  const link = await (await consentLinks()).findOne({ token }, { projection: { _id: 0 } });
  if (!enlaceVigente(link)) return null;
  const patient = await findPatient(link.patientId);
  if (!patient) return null;
  const kind = hojaDelEnlace(link);
  return {
    kind,
    name: patient.name,
    dni: patient.document ?? "",
    nacimiento: isIsoDate(patient.birthDate) ? patient.birthDate.split("-").reverse().join("/") : "",
    notas: link.notas ?? [],
    piezas: kind === "general" ? piezasDe(patient) : {},
    texto: await readTexto(kind),
  };
}

async function textosConsentimiento(): Promise<Collection<TextoDoc>> {
  return (await consultorioDb()).collection<TextoDoc>("textos_consentimiento");
}

/** El texto vigente de una hoja: el que editó Jesica o, si nunca lo tocó, el de fábrica. */
export async function readTexto(kind: HojaEditable): Promise<TextoVigente> {
  await prepare();
  const doc = await (await textosConsentimiento()).findOne({ kind }, { projection: { _id: 0 } });
  const texto = doc ? sanitizeTexto(doc) : null;
  return doc && texto ? { ...texto, version: doc.version } : textoDeFabrica(kind);
}

export async function readTextos(): Promise<Record<HojaEditable, TextoVigente>> {
  const textos = await Promise.all(HOJAS_EDITABLES.map((kind) => readTexto(kind)));
  return Object.fromEntries(HOJAS_EDITABLES.map((kind, index) => [kind, textos[index]])) as Record<HojaEditable, TextoVigente>;
}

/** Guarda el texto editado como una versión nueva. Las firmas anteriores conservan su copia. */
export function saveTextoRecord(kind: HojaEditable, input: unknown) {
  return turn(async () => {
    const texto = sanitizeTexto(input);
    if (!texto) throw new Error("Falta el título o el texto.");
    const actual = await readTexto(kind);
    const version = `${kind}-v${numeroDeVersion(actual.version) + 1}`;
    await (await textosConsentimiento()).updateOne(
      { kind },
      { $set: { ...texto, kind, version, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return { ...texto, version };
  });
}

export function signWithConsentLink(
  token: string,
  kind: string,
  version: string,
  firma: { aclaracion: string; firmante?: Firmante; dniFirmante?: string },
  file: File,
) {
  return turn(async () => {
    await prepare();
    if (!esToken(token)) throw new Error("Este enlace ya no sirve.");
    const links = await consentLinks();
    const link = await links.findOne({ token });
    if (!enlaceVigente(link)) throw new Error("Este enlace ya no sirve.");
    const hoja = hojaDelEnlace(link);
    if (hoja !== kind) throw new Error("Este enlace ya no sirve.");
    const patient = await findPatient(link.patientId);
    if (!patient) throw new Error("Este enlace ya no sirve.");
    // Si Jesica cambió el texto mientras el paciente lo leía, tiene que leer el nuevo.
    const vigente = await readTexto(hoja);
    if (version !== vigente.version) throw new Error("El texto cambió. Recargá la página para leer la versión nueva.");
    await writeSignature(patient.id, hoja, file, {
      source: "pantalla",
      aclaracion: firma.aclaracion,
      textVersion: vigente.version,
      texto: { titulo: vigente.titulo, apartados: vigente.apartados },
      ...(hoja === "general"
        ? { piezasSnapshot: piezasDe(patient) }
        : { firmante: firma.firmante, dniFirmante: firma.dniFirmante, notas: link.notas ?? [] }),
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

/** Los mensajes de WhatsApp de confirmación y recordatorio de turnos, como los dejó Jesica. */
export async function readMensajesTurno(): Promise<MensajesTurno> {
  await prepare();
  const doc = await (await mensajesWhatsapp()).findOne({ id: MENSAJES_TURNO }, { projection: { _id: 0 } });
  return sanitizeMensajes(doc);
}

export function saveMensajesRecord(input: unknown) {
  return turn(async () => {
    await prepare();
    const mensajes = sanitizeMensajes(input);
    await (await mensajesWhatsapp()).updateOne(
      { id: MENSAJES_TURNO },
      { $set: { ...mensajes, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return mensajes;
  });
}
