import { isIsoDate, todayInArgentina } from "./fecha";
import { pesos } from "./money";
import type { FeeItem, ItemPresupuesto, Presupuesto } from "./types";

const MAX_PRECIOS = 500;
const MAX_PRESUPUESTOS = 50;
const MAX_ITEMS = 100;
export const MAX_NOMBRE_PRESTACION = 120;
export const MAX_TIPO = 60;
const MAX_TITULO = 120;
const MAX_NOTA = 2000;
const MAX_PRECIO = 100_000_000;

const idValido = /^[A-Za-z0-9_.-]{1,80}$/;
const idsReservados = new Set(["__proto__", "constructor", "prototype"]);

function esId(value: unknown): value is string {
  return typeof value === "string" && idValido.test(value) && !idsReservados.has(value);
}

function recortar(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function fecha(value: unknown) {
  const texto = recortar(value, 10);
  return isIsoDate(texto) ? texto : "";
}

export function precioValido(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numero = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numero) || numero < 0 || numero > MAX_PRECIO) return null;
  return Math.round(numero);
}

function cantidadValida(value: unknown) {
  const numero = Math.round(Number(value));
  if (!Number.isFinite(numero) || numero < 1) return 1;
  return Math.min(numero, 999);
}

/** Lista de precios de Jesica. Un nombre vacío rechaza todo el guardado, para no perder la fila. */
export function sanitizePrecios(input: unknown): FeeItem[] {
  if (!Array.isArray(input)) throw new Error("No se pudo leer la lista de precios.");
  if (input.length > MAX_PRECIOS) throw new Error(`La lista puede tener hasta ${MAX_PRECIOS} filas.`);
  const vistos = new Set<string>();
  return input.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("No se pudo leer la lista de precios.");
    const item = raw as Partial<FeeItem>;
    const name = recortar(item.name, MAX_NOMBRE_PRESTACION);
    if (!name) throw new Error("Escribí el nombre de la prestación antes de guardar.");
    if (!esId(item.id) || vistos.has(item.id)) throw new Error("No se pudo leer la lista de precios.");
    vistos.add(item.id);
    return { id: item.id, chapter: recortar(item.chapter, MAX_TIPO), name, price: precioValido(item.price) };
  });
}

function itemDe(raw: unknown): ItemPresupuesto | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ItemPresupuesto>;
  if (!esId(item.id)) return null;
  return {
    id: item.id,
    tipo: recortar(item.tipo, MAX_TIPO),
    name: recortar(item.name, MAX_NOMBRE_PRESTACION),
    cantidad: cantidadValida(item.cantidad),
    precio: precioValido(item.precio),
  };
}

export function sanitizePresupuestos(input: unknown): Presupuesto[] {
  if (!Array.isArray(input)) return [];
  if (input.length > MAX_PRESUPUESTOS) throw new Error(`La ficha puede tener hasta ${MAX_PRESUPUESTOS} presupuestos.`);
  return input.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Partial<Presupuesto>;
    if (!esId(item.id)) return [];
    const items = Array.isArray(item.items) ? item.items : [];
    if (items.length > MAX_ITEMS) throw new Error(`Un presupuesto puede tener hasta ${MAX_ITEMS} filas.`);
    return [
      {
        id: item.id,
        titulo: recortar(item.titulo, MAX_TITULO),
        createdOn: fecha(item.createdOn),
        items: items.flatMap((fila) => {
          const limpia = itemDe(fila);
          return limpia ? [limpia] : [];
        }),
        nota: recortar(item.nota, MAX_NOTA),
        sentOn: fecha(item.sentOn),
      },
    ];
  });
}

export function subtotal(item: ItemPresupuesto) {
  return item.precio == null ? null : item.precio * item.cantidad;
}

export function totalDe(presupuesto: Pick<Presupuesto, "items">) {
  const conNombre = presupuesto.items.filter((item) => item.name.trim());
  const total = conNombre.reduce((suma, item) => suma + (subtotal(item) ?? 0), 0);
  const sinPrecio = conNombre.filter((item) => item.precio == null).length;
  return { total, sinPrecio };
}

export function tituloPorDefecto(isoDate: string) {
  return `Presupuesto del ${isoDate.split("-").reverse().join("/")}`;
}

/** El título lo cambió Jesica (no es el que se pone solo con la fecha). */
export function tituloPropio(presupuesto: Pick<Presupuesto, "titulo" | "createdOn">) {
  const titulo = presupuesto.titulo.trim();
  return titulo && titulo !== tituloPorDefecto(presupuesto.createdOn) ? titulo : "";
}

export function presupuestoNuevo(hoy = todayInArgentina()): Presupuesto {
  return { id: crypto.randomUUID(), titulo: tituloPorDefecto(hoy), createdOn: hoy, items: [], nota: "", sentOn: "" };
}

/** Lista de precios por categoría y nombre; las que no tienen categoría van al final. */
export function ordenarPrecios(items: FeeItem[]) {
  const clave = (texto: string) => texto.trim().toLocaleLowerCase("es");
  return [...items].sort((a, b) => {
    const sinA = clave(a.chapter) === "";
    const sinB = clave(b.chapter) === "";
    if (sinA !== sinB) return sinA ? 1 : -1;
    return clave(a.chapter).localeCompare(clave(b.chapter), "es") || clave(a.name).localeCompare(clave(b.name), "es");
  });
}

function nombreDePila(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? "";
}

/** Texto que se manda por WhatsApp. Usa *negrita* de WhatsApp. */
export function mensajePresupuesto(paciente: string, presupuesto: Presupuesto) {
  const filas = presupuesto.items.filter((item) => item.name.trim());
  const tipos = Array.from(new Set(filas.map((item) => item.tipo.trim())));
  const agrupar = tipos.length > 1;
  const lineas: string[] = [];
  const saludo = nombreDePila(paciente);
  lineas.push(`Hola${saludo ? ` ${saludo}` : ""}, te paso el presupuesto:`);
  lineas.push("");

  const linea = (item: ItemPresupuesto) => {
    const cantidad = item.cantidad > 1 ? ` ×${item.cantidad}` : "";
    const valor = subtotal(item);
    return `• ${item.name.trim()}${cantidad}: ${valor == null ? "a confirmar" : `$${pesos(valor)}`}`;
  };

  if (agrupar) {
    tipos.forEach((tipo, indice) => {
      if (indice > 0) lineas.push("");
      lineas.push(`*${tipo || "Otros"}*`);
      filas.filter((item) => item.tipo.trim() === tipo).forEach((item) => lineas.push(linea(item)));
    });
  } else {
    filas.forEach((item) => lineas.push(linea(item)));
  }

  const { total, sinPrecio } = totalDe(presupuesto);
  lineas.push("");
  lineas.push(`*Total: $${pesos(total)}*${sinPrecio > 0 ? " (sin contar lo que está a confirmar)" : ""}`);
  if (presupuesto.nota.trim()) {
    lineas.push("");
    lineas.push(presupuesto.nota.trim());
  }
  lineas.push("");
  lineas.push("Od. Jesica Brenda Goroso");
  return lineas.join("\n");
}
