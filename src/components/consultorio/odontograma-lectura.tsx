import { fechaEnPalabras } from "@/lib/consultorio/fecha";
import {
  cuadrantes,
  estadoDePieza,
  nombreEstado,
  piezaAusente,
  type EstadoPieza,
} from "@/lib/consultorio/odontograma";
import { allTeeth, type EstadoPrestacion, type Piezas, type PrestacionPieza } from "@/lib/consultorio/types";

export const colorEstado: Record<EstadoPrestacion, string> = {
  pendiente: "#b3261e",
  realizada: "#1f5fbf",
  "": "#6b7280",
};

const colorFranja: Record<EstadoPieza, string> = {
  pendiente: colorEstado.pendiente,
  realizada: colorEstado.realizada,
  "sin-indicar": "#c9ccd1",
  sana: "#f3f1eb",
};

export function describirPieza(pieza: string, lista: PrestacionPieza[] | undefined) {
  if (!lista || lista.length === 0) return `Pieza ${pieza}, sin prestaciones`;
  return `Pieza ${pieza}: ${lista.map((item) => `${item.name} ${nombreEstado[item.estado]}`).join(", ")}`;
}

/** Lo que se ve dentro de cada diente: franja de estado, número y abreviaturas. */
export function ContenidoPieza({ pieza, lista, max = 2 }: { pieza: string; lista: PrestacionPieza[] | undefined; max?: number }) {
  const items = lista ?? [];
  const visibles = items.slice(0, max);
  const resto = items.length - visibles.length;
  return (
    <>
      <span className="block h-3 w-full shrink-0" style={{ background: colorFranja[estadoDePieza(items)] }} />
      <span className={`block pt-1 ${piezaAusente(items) ? "line-through" : ""}`}>{pieza}</span>
      <span className="flex min-h-5 flex-col px-0.5 pb-1 text-xs font-semibold leading-tight">
        {visibles.map((item) => (
          <span key={item.id} className="truncate" style={{ color: colorEstado[item.estado] }}>
            {item.estado === "realizada" ? "✓ " : ""}
            {item.short}
          </span>
        ))}
        {resto > 0 ? <span className="font-normal text-muted">+{resto} más</span> : null}
      </span>
    </>
  );
}

export function LeyendaOdontograma({ conSinIndicar = false }: { conSinIndicar?: boolean }) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-base">
      <span className="font-semibold" style={{ color: colorEstado.pendiente }}>
        Rojo: a realizar
      </span>
      <span className="font-semibold" style={{ color: colorEstado.realizada }}>
        Azul ✓: realizada
      </span>
      {conSinIndicar ? (
        <span className="font-semibold" style={{ color: colorEstado[""] }}>
          Gris: del odontograma anterior, sin indicar
        </span>
      ) : null}
    </p>
  );
}

/** Lista escrita, pieza por pieza. Se usa al imprimir y al firmar. */
export function ListaPiezas({ piezas }: { piezas: Piezas }) {
  const conDatos = allTeeth.filter((pieza) => (piezas[pieza] ?? []).length > 0);
  if (conDatos.length === 0) return <p className="text-muted">No hay prestaciones marcadas.</p>;
  return (
    <ul className="space-y-1">
      {conDatos.map((pieza) => (
        <li key={pieza}>
          <span className="font-semibold">Pieza {pieza}:</span>{" "}
          {(piezas[pieza] ?? []).map((item, indice) => (
            <span key={item.id}>
              {indice > 0 ? "; " : ""}
              <span style={{ color: colorEstado[item.estado] }}>
                {item.name} ({nombreEstado[item.estado]}
                {item.estado === "realizada" && item.doneOn ? ` el ${fechaEnPalabras(item.doneOn)}` : ""})
              </span>
              {item.nota ? ` · ${item.nota}` : ""}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}

/** Odontograma de solo lectura con el formato nuevo (varias prestaciones por diente). */
export function OdontogramaPiezasLectura({ piezas }: { piezas: Piezas }) {
  const conSinIndicar = Object.values(piezas).some((lista) => (lista ?? []).some((item) => item.estado === ""));
  return (
    <div className="space-y-4 [print-color-adjust:exact]">
      <div className="grid gap-4 sm:grid-cols-2">
        {cuadrantes.map((cuadrante) => (
          <div key={cuadrante.title}>
            <p className="text-sm text-muted">{cuadrante.title}</p>
            <div className="mt-2 grid grid-cols-8 gap-1">
              {cuadrante.teeth.map((pieza) => (
                <div
                  key={pieza}
                  role="img"
                  aria-label={describirPieza(pieza, piezas[pieza])}
                  className="flex flex-col overflow-hidden rounded border border-sand bg-white text-center text-xs text-forest"
                >
                  <ContenidoPieza pieza={pieza} lista={piezas[pieza]} max={1} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <LeyendaOdontograma conSinIndicar={conSinIndicar} />
      <ListaPiezas piezas={piezas} />
    </div>
  );
}
