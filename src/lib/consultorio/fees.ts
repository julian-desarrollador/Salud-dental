import raw from "./fees.json";

/**
 * Lista del Colegio de Odontólogos que se sembraba antes en "Mis precios".
 * Ya no se siembra: solo sirve para reconocer esas filas y borrar las que Jesica no tocó.
 */
export function seedFees(): { id: string; minimum: number }[] {
  return raw.map((item) => ({ id: item.code, minimum: item.minimum }));
}
