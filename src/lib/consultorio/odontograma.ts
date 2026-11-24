import { isIsoDate } from "./fecha";
import {
  allTeeth,
  toothMarks,
  type EstadoPrestacion,
  type PasoPlan,
  type Piezas,
  type PrestacionCatalogo,
  type PrestacionPieza,
  type ToothMark,
} from "./types";

const MAX_CATALOGO = 100;
const MAX_NOMBRE = 60;
export const MAX_ABREVIATURA = 10;
const MAX_POR_PIEZA = 20;
const MAX_NOTA = 300;
const MAX_PASOS = 100;
const MAX_TEXTO_PASO = 1000;

const idValido = /^[A-Za-z0-9_-]{1,80}$/;
const idsReservados = new Set(["__proto__", "constructor", "prototype"]);
const piezasValidas = new Set<string>(allTeeth);
const estados = new Set<EstadoPrestacion>(["pendiente", "realizada", ""]);

/**
 * Los cuatro cuadrantes, con las piezas desde el medio hacia afuera (como las numera Jesica).
 * Los del lado derecho del paciente se dibujan de derecha a izquierda, así el 11 y el 41
 * quedan pegados al medio: 18…11 | 21…28.
 */
export const cuadrantes: { title: string; lado: "derecha" | "izquierda"; arriba: boolean; teeth: string[] }[] = [
  { title: "Arriba, derecha del paciente", lado: "derecha", arriba: true, teeth: ["11", "12", "13", "14", "15", "16", "17", "18"] },
  { title: "Arriba, izquierda del paciente", lado: "izquierda", arriba: true, teeth: ["21", "22", "23", "24", "25", "26", "27", "28"] },
  { title: "Abajo, derecha del paciente", lado: "derecha", arriba: false, teeth: ["41", "42", "43", "44", "45", "46", "47", "48"] },
  { title: "Abajo, izquierda del paciente", lado: "izquierda", arriba: false, teeth: ["31", "32", "33", "34", "35", "36", "37", "38"] },
];

/** Bordes de la cruz del medio (derecha | izquierda, arriba / abajo) cuando los cuadrantes van de a dos. */
export function bordesDelMedio(cuadrante: { lado: "derecha" | "izquierda"; arriba: boolean }, ancho: "md" | "sm") {
  const derecha = cuadrante.lado === "derecha";
  if (ancho === "md") {
    return [
      derecha ? "md:border-r md:pr-5" : "md:pl-5",
      cuadrante.arriba ? "md:border-b md:pb-5" : "md:pt-5",
    ].join(" ");
  }
  return [
    derecha ? "sm:border-r sm:pr-3" : "sm:pl-3",
    cuadrante.arriba ? "sm:border-b sm:pb-3" : "sm:pt-3",
  ].join(" ");
}

export const catalogoInicial: PrestacionCatalogo[] = [
  { id: "caries", name: "Caries", short: "Caries" },
  { id: "extraccion", name: "Extracción", short: "Extrac." },
  { id: "restauracion", name: "Restauración (arreglo)", short: "Restaur." },
  { id: "endodoncia", name: "Endodoncia (conducto)", short: "Endo" },
  { id: "perno", name: "Perno", short: "Perno" },
  { id: "corona", name: "Corona", short: "Corona" },
  { id: "carilla", name: "Carilla", short: "Carilla" },
  { id: "incrustacion", name: "Incrustación", short: "Incrust." },
  { id: "implante", name: "Implante", short: "Implante" },
  { id: "protesis", name: "Prótesis", short: "Prótesis" },
  { id: "limpieza", name: "Limpieza", short: "Limpieza" },
  { id: "ausente", name: "Ausente", short: "Ausente" },
];

export function esId(value: unknown): value is string {
  return typeof value === "string" && idValido.test(value) && !idsReservados.has(value);
}

function recortar(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function fecha(value: unknown) {
  const texto = recortar(value, 10);
  return isIsoDate(texto) ? texto : "";
}

export function abreviatura(name: string, short = "") {
  const propia = short.trim();
  if (propia) return propia.slice(0, MAX_ABREVIATURA);
  const nombre = name.trim().split(" (")[0];
  return nombre.length <= MAX_ABREVIATURA ? nombre : `${nombre.slice(0, MAX_ABREVIATURA - 1)}.`;
}

export function sanitizeCatalogo(input: unknown): PrestacionCatalogo[] {
  if (!Array.isArray(input)) throw new Error("No se pudo leer la lista de prestaciones.");
  if (input.length > MAX_CATALOGO) throw new Error(`La lista puede tener hasta ${MAX_CATALOGO} prestaciones.`);
  const vistos = new Set<string>();
  return input.map((item) => {
    if (!item || typeof item !== "object") throw new Error("No se pudo leer la lista de prestaciones.");
    const raw = item as Partial<PrestacionCatalogo>;
    const name = recortar(raw.name, MAX_NOMBRE);
    if (!name) throw new Error("Escribí el nombre de la prestación antes de guardar.");
    if (!esId(raw.id) || vistos.has(raw.id)) throw new Error("No se pudo leer la lista de prestaciones.");
    vistos.add(raw.id);
    return { id: raw.id, name, short: recortar(raw.short, MAX_ABREVIATURA) };
  });
}

function prestacionDe(raw: unknown): PrestacionPieza | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<PrestacionPieza>;
  const name = recortar(item.name, MAX_NOMBRE);
  if (!name || !esId(item.id) || !esId(item.prestacionId)) return null;
  const estado = estados.has(item.estado as EstadoPrestacion) ? (item.estado as EstadoPrestacion) : "";
  return {
    id: item.id,
    prestacionId: item.prestacionId,
    name,
    short: abreviatura(name, recortar(item.short, MAX_ABREVIATURA)),
    estado,
    nota: recortar(item.nota, MAX_NOTA),
    addedOn: fecha(item.addedOn),
    doneOn: estado === "realizada" ? fecha(item.doneOn) : "",
  };
}

export function sanitizePiezas(input: unknown): Piezas {
  const piezas: Piezas = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return piezas;
  for (const [pieza, lista] of Object.entries(input)) {
    if (!piezasValidas.has(pieza) || !Array.isArray(lista)) continue;
    if (lista.length > MAX_POR_PIEZA) throw new Error(`La pieza ${pieza} tiene demasiadas prestaciones.`);
    const limpias = lista.flatMap((raw) => {
      const prestacion = prestacionDe(raw);
      return prestacion ? [prestacion] : [];
    });
    if (limpias.length > 0) piezas[pieza] = limpias;
  }
  return piezas;
}

export function sanitizePlan(input: unknown): PasoPlan[] {
  if (!Array.isArray(input)) return [];
  if (input.length > MAX_PASOS) throw new Error(`El plan puede tener hasta ${MAX_PASOS} pasos.`);
  return input.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Partial<PasoPlan>;
    if (!esId(item.id)) return [];
    const done = item.done === true;
    return [{ id: item.id, text: recortar(item.text, MAX_TEXTO_PASO), done, doneOn: done ? fecha(item.doneOn) : "" }];
  });
}

const marcaVieja = Object.fromEntries(toothMarks.map((mark) => [mark.id, mark])) as Record<
  ToothMark,
  (typeof toothMarks)[number]
>;

/** Convierte el odontograma viejo (una marca por diente) sin inventar si está hecho o pendiente. */
export function piezasDesdeLegado(teeth: unknown): Piezas {
  const piezas: Piezas = {};
  if (!teeth || typeof teeth !== "object" || Array.isArray(teeth)) return piezas;
  for (const [pieza, mark] of Object.entries(teeth)) {
    const vieja = marcaVieja[mark as ToothMark];
    if (!piezasValidas.has(pieza) || !vieja || vieja.id === "sana") continue;
    piezas[pieza] = [
      {
        id: `legado-${pieza}`,
        prestacionId: vieja.id,
        name: vieja.label,
        short: vieja.short,
        estado: "",
        nota: "",
        addedOn: "",
        doneOn: "",
      },
    ];
  }
  return piezas;
}

export function piezasDe(patient: { piezas?: Piezas; teeth?: unknown }): Piezas {
  return patient.piezas ?? piezasDesdeLegado(patient.teeth);
}

export type EstadoPieza = "pendiente" | "realizada" | "sin-indicar" | "sana";

export function estadoDePieza(lista: PrestacionPieza[] | undefined): EstadoPieza {
  if (!lista || lista.length === 0) return "sana";
  if (lista.some((item) => item.estado === "pendiente")) return "pendiente";
  if (lista.some((item) => item.estado === "realizada")) return "realizada";
  return "sin-indicar";
}

export function piezaAusente(lista: PrestacionPieza[] | undefined) {
  return (lista ?? []).some((item) => item.prestacionId === "ausente");
}

export const nombreEstado: Record<EstadoPrestacion, string> = {
  pendiente: "a realizar",
  realizada: "realizada",
  "": "sin indicar",
};

export function mover<T extends { id: string }>(lista: T[], id: string, salto: -1 | 1): T[] {
  const indice = lista.findIndex((item) => item.id === id);
  const destino = indice + salto;
  if (indice < 0 || destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}
