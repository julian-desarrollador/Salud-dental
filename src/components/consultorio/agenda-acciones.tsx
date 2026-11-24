"use client";

import { useState } from "react";
import { anularTurno, borrarBloqueo, marcarAviso } from "@/app/consultorio/agenda/actions";
import { BotonWhatsapp } from "@/components/consultorio/boton-whatsapp";
import { Confirmacion } from "@/components/consultorio/confirmacion";
import type { AvisoTurno, Turno } from "@/lib/consultorio/agenda";
import { diaCorto, sumarDias } from "@/lib/consultorio/agenda-horario";
import { completarPlantilla, type MensajesTurno } from "@/lib/consultorio/avisos-turno";
import { todayInArgentina } from "@/lib/consultorio/fecha";
import { abrirWhatsapp, enlaceWhatsapp } from "@/lib/consultorio/whatsapp";

type TurnoConAvisos = Pick<
  Turno,
  "id" | "patientName" | "phone" | "dateKey" | "timeLocal" | "reason" | "waAssignmentSentAt" | "waReminder24hSentAt"
>;

/**
 * Los WhatsApp de confirmación y recordatorio, que Jesica manda a mano: el botón abre WhatsApp
 * con el mensaje escrito y deja el turno marcado como enviado.
 */
export function AvisosTurno({ turno, hoy, mensajes }: { turno: TurnoConAvisos; hoy: string; mensajes: MensajesTurno }) {
  const [enviados, setEnviados] = useState<Record<AvisoTurno, string | null>>({
    confirmacion: turno.waAssignmentSentAt,
    recordatorio: turno.waReminder24hSentAt,
  });
  const [error, setError] = useState("");
  const pasado = turno.dateKey < hoy;
  const cerca = turno.dateKey === hoy || turno.dateKey === sumarDias(hoy, 1);
  // A lo sumo un botón destacado: lo próximo que conviene mandar.
  const destacado: AvisoTurno | null = !enviados.confirmacion
    ? "confirmacion"
    : !enviados.recordatorio && cerca
      ? "recordatorio"
      : null;

  function marcar(aviso: AvisoTurno, enviado: boolean) {
    const antes = enviados[aviso];
    setError("");
    setEnviados((actual) => ({ ...actual, [aviso]: enviado ? new Date().toISOString() : null }));
    marcarAviso(turno.id, aviso, enviado).catch(() => {
      setEnviados((actual) => ({ ...actual, [aviso]: antes }));
      setError("No se pudo guardar. Probá de nuevo.");
    });
  }

  function enviar(aviso: AvisoTurno) {
    const texto = completarPlantilla(mensajes[aviso], turno, todayInArgentina());
    abrirWhatsapp(enlaceWhatsapp(turno.phone, texto));
    marcar(aviso, true);
  }

  const filas: { aviso: AvisoTurno; titulo: string; boton: string; femenino: boolean }[] = [
    { aviso: "confirmacion", titulo: "Confirmación del turno", boton: "Enviar confirmación", femenino: true },
    { aviso: "recordatorio", titulo: "Recordatorio", boton: "Enviar recordatorio", femenino: false },
  ];

  return (
    <div className="mt-3 grid gap-3 rounded-xl border border-sand bg-cream px-3 py-3 text-forest">
      {filas.map(({ aviso, titulo, boton, femenino }) => {
        const enviado = enviados[aviso];
        return (
          <div key={aviso}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-semibold">{titulo}</span>
              <span className={enviado ? "text-forest" : "text-muted"}>
                {enviado
                  ? `✓ ${femenino ? "Enviada" : "Enviado"} el ${diaCorto(todayInArgentina(new Date(enviado)))}`
                  : pasado
                    ? "No se envió"
                    : "Sin enviar"}
              </span>
            </p>
            {pasado ? null : (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <BotonWhatsapp onClick={() => enviar(aviso)} principal={destacado === aviso} chico className="w-full sm:w-auto">
                  {enviado ? "Reenviar" : boton}
                </BotonWhatsapp>
                {enviado ? (
                  <button
                    type="button"
                    onClick={() => marcar(aviso, false)}
                    className="min-h-11 cursor-pointer text-muted underline underline-offset-4"
                  >
                    Desmarcar
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
      {error ? (
        <p role="alert" className="text-[#6b2e2a]">
          {error}
        </p>
      ) : null}
    </div>
  );
}


export function CancelarTurno({ id, dia }: { id: string; dia: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button type="button" className="shrink-0 text-[#6b2e2a]" onClick={() => setAsk(true)}>
        Cancelar turno
      </button>
      {ask ? (
        <Confirmacion
          title="¿Cancelar este turno?"
          text="El horario queda libre."
          confirm="Sí, cancelar"
          onClose={() => {
            if (!pending) setAsk(false);
          }}
          onConfirm={() => {
            if (pending) return;
            setPending(true);
            void anularTurno(id, dia);
          }}
        />
      ) : null}
    </>
  );
}

export function QuitarBloqueo({ id, dia }: { id: string; dia: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-4 text-[#6b2e2a] disabled:opacity-40"
      onClick={() => {
        setPending(true);
        void borrarBloqueo(id, dia);
      }}
    >
      Quitar bloqueo
    </button>
  );
}
