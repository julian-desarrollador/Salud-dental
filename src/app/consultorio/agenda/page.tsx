import { AgendaVista } from "@/components/consultorio/agenda-vista";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { leerAgenda } from "@/lib/consultorio/agenda";
import { grillaDelMes, leerMes } from "@/lib/consultorio/agenda-horario";
import { todayInArgentina } from "@/lib/consultorio/fecha";
import { requireSession } from "@/lib/consultorio/guard";

function uno(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const query = await searchParams;
  const hoy = todayInArgentina();
  const mes = leerMes(uno(query.mes), hoy);
  const pedido = uno(query.dia);
  const grilla = grillaDelMes(mes.year, mes.month);
  const dia = pedido && grilla.some((cell) => cell.dateKey === pedido) ? pedido : hoy.slice(0, 7) === mes.key ? hoy : `${mes.key}-01`;
  const desde = grilla[0]?.dateKey ?? `${mes.key}-01`;
  const hasta = grilla[grilla.length - 1]?.dateKey ?? `${mes.key}-28`;
  const agenda = await leerAgenda(desde, hasta);

  return (
    <ConsultorioShell current="/consultorio/agenda">
      <AgendaVista
        year={mes.year}
        month={mes.month}
        dia={dia}
        canceladas={uno(query.canceladas) === "1"}
        whatsappFallo={uno(query.whatsapp) === "no"}
        turnos={agenda.turnos}
        bloqueos={agenda.bloqueos}
      />
    </ConsultorioShell>
  );
}
