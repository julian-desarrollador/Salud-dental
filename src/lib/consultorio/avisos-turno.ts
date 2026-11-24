import { diaCorto, diaDeSemana, sumarDias } from "./agenda-horario";

type TurnoParaAviso = { patientName: string; dateKey: string; timeLocal: string; reason: string };

export type MensajesTurno = { confirmacion: string; recordatorio: string };

export const MAX_MENSAJE = 1000;

/** Los datos que Jesica puede poner en sus mensajes; al enviar se completan con los del turno. */
export const DATOS_DEL_TURNO = [
  { marcador: "{paciente}", etiqueta: "Paciente" },
  { marcador: "{fecha}", etiqueta: "Día del turno" },
  { marcador: "{cuando}", etiqueta: "Hoy / mañana" },
  { marcador: "{hora}", etiqueta: "Hora" },
  { marcador: "{motivo}", etiqueta: "Motivo" },
] as const;

export const PLANTILLAS_INICIALES: MensajesTurno = {
  confirmacion:
    "¡Hola! Te escribo de Salud Dental para confirmar el turno de *{paciente}*: {fecha} a las {hora} hs ({motivo}). " +
    "Te esperamos en San Lorenzo 2908, Mar del Plata. Si necesitás cambiarlo, avisanos por acá.\n\n" +
    "Od. Jesica Brenda Goroso",
  recordatorio:
    "¡Hola! Te recordamos el turno de *{paciente}* {cuando} a las {hora} hs en Salud Dental " +
    "(San Lorenzo 2908, Mar del Plata). Si no podés venir, avisanos por acá. ¡Gracias!",
};

/** "martes 25 de noviembre" */
function fechaDelTurno(dateKey: string) {
  return `${diaDeSemana(dateKey).toLocaleLowerCase("es")} ${diaCorto(dateKey)}`;
}

/** Cómo nombrar el día del turno según cuándo se manda el mensaje. */
export function cuandoEs(dateKey: string, hoy: string) {
  if (dateKey === hoy) return "hoy";
  if (dateKey === sumarDias(hoy, 1)) return "mañana";
  return `el ${fechaDelTurno(dateKey)}`;
}

const MARCADOR = /\{([^{}\s]{1,30})\}/g;

export function completarPlantilla(plantilla: string, turno: TurnoParaAviso, hoy: string) {
  const datos: Record<string, string> = {
    paciente: turno.patientName.trim(),
    fecha: fechaDelTurno(turno.dateKey),
    cuando: cuandoEs(turno.dateKey, hoy),
    hora: turno.timeLocal,
    motivo: turno.reason.trim() || "Consulta",
  };
  return plantilla.replace(MARCADOR, (entero, nombre: string) => datos[nombre.toLocaleLowerCase("es")] ?? entero);
}

/** Marcadores que no son un dato del turno (por ejemplo "{nombre}"): quedarían escritos tal cual. */
export function marcadoresDesconocidos(plantilla: string) {
  const conocidos = new Set<string>(DATOS_DEL_TURNO.map((dato) => dato.marcador));
  const raros = [...plantilla.matchAll(MARCADOR)]
    .map((match) => match[0])
    .filter((marcador) => !conocidos.has(marcador.toLocaleLowerCase("es")));
  return [...new Set(raros)];
}

function textoOInicial(value: unknown, inicial: string) {
  const texto = typeof value === "string" ? value.replace(/\r\n?/g, "\n").slice(0, MAX_MENSAJE) : "";
  return texto.trim() ? texto : inicial;
}

export function sanitizeMensajes(input: unknown): MensajesTurno {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    confirmacion: textoOInicial(raw.confirmacion, PLANTILLAS_INICIALES.confirmacion),
    recordatorio: textoOInicial(raw.recordatorio, PLANTILLAS_INICIALES.recordatorio),
  };
}
