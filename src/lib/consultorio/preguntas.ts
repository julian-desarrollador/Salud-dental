import { isIsoDate } from "./fecha";
import type {
  PreguntaMedica,
  RespuestaMedica,
  RespuestaSiNo,
  RespuestasMedicas,
  TipoPregunta,
} from "./types";

export const MAX_NIVELES = 5;
const MAX_PREGUNTAS = 300;
const MAX_TEXTO_PREGUNTA = 200;
const MAX_RESPUESTAS = 500;
const MAX_TEXTO_RESPUESTA = 2000;

const idValido = /^[A-Za-z0-9_-]{1,80}$/;
const idsReservados = new Set(["__proto__", "constructor", "prototype"]);

export const preguntasIniciales: PreguntaMedica[] = [
  { id: "cardiacos", text: "Problemas cardíacos", kind: "sino", children: [] },
  { id: "presion", text: "Problemas de presión arterial", kind: "sino", children: [] },
  {
    id: "medicamentos",
    text: "Toma algún medicamento",
    kind: "sino",
    children: [{ id: "medicamentos-cual", text: "¿Cuál o cuáles?", kind: "texto", showWhen: "si", children: [] }],
  },
  {
    id: "alergias",
    text: "Alergias",
    kind: "sino",
    children: [{ id: "alergias-cual", text: "¿A qué?", kind: "texto", showWhen: "si", children: [] }],
  },
  { id: "diabetes", text: "Diabetes", kind: "sino", children: [] },
  { id: "tiroides", text: "Problemas de tiroides", kind: "sino", children: [] },
];

function esId(value: unknown): value is string {
  return typeof value === "string" && idValido.test(value) && !idsReservados.has(value);
}

function recortar(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export function sanitizePreguntas(input: unknown): PreguntaMedica[] {
  const vistos = new Set<string>();

  function nivel(items: unknown, profundidad: number, esSubpregunta: boolean): PreguntaMedica[] {
    if (!Array.isArray(items)) throw new Error("No se pudo leer la lista de preguntas.");
    if (items.length > 0 && profundidad > MAX_NIVELES) {
      throw new Error(`Las subpreguntas pueden tener hasta ${MAX_NIVELES} niveles.`);
    }
    return items.map((item) => {
      if (!item || typeof item !== "object") throw new Error("No se pudo leer la lista de preguntas.");
      const raw = item as Partial<PreguntaMedica>;
      const text = recortar(raw.text, MAX_TEXTO_PREGUNTA);
      if (!text) throw new Error("Escribí la pregunta antes de guardar.");
      if (!esId(raw.id) || vistos.has(raw.id)) throw new Error("No se pudo leer la lista de preguntas.");
      if (raw.kind !== "sino" && raw.kind !== "texto") throw new Error("No se pudo leer la lista de preguntas.");
      vistos.add(raw.id);
      if (vistos.size > MAX_PREGUNTAS) throw new Error(`La lista puede tener hasta ${MAX_PREGUNTAS} preguntas.`);
      const pregunta: PreguntaMedica = {
        id: raw.id,
        text,
        kind: raw.kind,
        children: raw.kind === "sino" ? nivel(raw.children ?? [], profundidad + 1, true) : [],
      };
      if (esSubpregunta) pregunta.showWhen = raw.showWhen === "no" ? "no" : "si";
      return pregunta;
    });
  }

  return nivel(input, 1, false);
}

function respuestaDe(raw: unknown): RespuestaMedica | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<RespuestaMedica>;
  if (item.kind !== "sino" && item.kind !== "texto") return null;
  const value = recortar(item.value, MAX_TEXTO_RESPUESTA);
  if (!value || (item.kind === "sino" && value !== "si" && value !== "no")) return null;
  const answeredOn = recortar(item.answeredOn, 10);
  return {
    question: recortar(item.question, MAX_TEXTO_PREGUNTA),
    kind: item.kind,
    value,
    answeredOn: isIsoDate(answeredOn) ? answeredOn : "",
  };
}

export function sanitizeRespuestas(input: unknown): RespuestasMedicas {
  const respuestas: RespuestasMedicas = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return respuestas;
  const entradas = Object.entries(input);
  if (entradas.length > MAX_RESPUESTAS) throw new Error("Esta ficha tiene demasiadas respuestas.");
  for (const [id, raw] of entradas) {
    if (!esId(id)) continue;
    const respuesta = respuestaDe(raw);
    if (respuesta) respuestas[id] = respuesta;
  }
  return respuestas;
}

export function nuevaPregunta(kind: TipoPregunta, esSubpregunta: boolean): PreguntaMedica {
  const pregunta: PreguntaMedica = { id: crypto.randomUUID(), text: "", kind, children: [] };
  if (esSubpregunta) pregunta.showWhen = "si";
  return pregunta;
}

export function agregarSubpregunta(preguntas: PreguntaMedica[], padreId: string, nueva: PreguntaMedica): PreguntaMedica[] {
  return preguntas.map((pregunta) =>
    pregunta.id === padreId
      ? { ...pregunta, children: [...pregunta.children, nueva] }
      : { ...pregunta, children: agregarSubpregunta(pregunta.children, padreId, nueva) },
  );
}

export function editarPregunta(
  preguntas: PreguntaMedica[],
  id: string,
  cambios: Partial<Pick<PreguntaMedica, "text" | "showWhen">>,
): PreguntaMedica[] {
  return preguntas.map((pregunta) =>
    pregunta.id === id
      ? { ...pregunta, ...cambios }
      : { ...pregunta, children: editarPregunta(pregunta.children, id, cambios) },
  );
}

export function quitarPregunta(preguntas: PreguntaMedica[], id: string): PreguntaMedica[] {
  return preguntas
    .filter((pregunta) => pregunta.id !== id)
    .map((pregunta) => ({ ...pregunta, children: quitarPregunta(pregunta.children, id) }));
}

export function moverPregunta(preguntas: PreguntaMedica[], id: string, salto: -1 | 1): PreguntaMedica[] {
  const indice = preguntas.findIndex((pregunta) => pregunta.id === id);
  if (indice >= 0) {
    const destino = indice + salto;
    if (destino < 0 || destino >= preguntas.length) return preguntas;
    const copia = [...preguntas];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    return copia;
  }
  return preguntas.map((pregunta) => ({ ...pregunta, children: moverPregunta(pregunta.children, id, salto) }));
}

export function subpreguntasVisibles(pregunta: PreguntaMedica, valor: string | undefined) {
  if (pregunta.kind !== "sino" || (valor !== "si" && valor !== "no")) return [];
  const respuesta: RespuestaSiNo = valor;
  return pregunta.children.filter((hija) => (hija.showWhen ?? "si") === respuesta);
}

export function respuestasRetiradas(preguntas: PreguntaMedica[], respuestas: RespuestasMedicas) {
  const vigentes = new Set<string>();
  function recorrer(items: PreguntaMedica[]) {
    for (const item of items) {
      vigentes.add(item.id);
      recorrer(item.children);
    }
  }
  recorrer(preguntas);
  return Object.entries(respuestas)
    .filter(([id]) => !vigentes.has(id))
    .map(([id, respuesta]) => ({ id, ...respuesta }));
}

export function resumenAntecedentes(preguntas: PreguntaMedica[], respuestas: RespuestasMedicas) {
  const conSi: string[] = [];
  let sinResponder = 0;
  function recorrer(items: PreguntaMedica[]) {
    for (const item of items) {
      const valor = respuestas[item.id]?.value;
      if (!valor) sinResponder += 1;
      if (item.kind === "sino" && valor === "si") conSi.push(item.text);
      recorrer(subpreguntasVisibles(item, valor));
    }
  }
  recorrer(preguntas);
  const partes: string[] = [];
  if (conSi.length > 0) partes.push(`Sí: ${conSi.join(", ")}`);
  if (sinResponder > 0) partes.push(`${sinResponder} sin responder`);
  if (partes.length > 0) return partes.join(" · ");
  return preguntas.length > 0 ? "Todo respondido, sin ningún Sí." : "Todavía no hay preguntas en tu lista.";
}
