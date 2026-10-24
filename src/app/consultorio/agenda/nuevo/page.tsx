import { NuevoTurno } from "@/components/consultorio/nuevo-turno";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { isIsoDate, todayInArgentina } from "@/lib/consultorio/fecha";
import { requireSession } from "@/lib/consultorio/guard";

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const query = await searchParams;
  const raw = Array.isArray(query.dia) ? query.dia[0] : query.dia;
  const dia = isIsoDate(raw) ? raw : todayInArgentina();

  return (
    <ConsultorioShell current="/consultorio/agenda">
      <NuevoTurno dia={dia} />
    </ConsultorioShell>
  );
}
