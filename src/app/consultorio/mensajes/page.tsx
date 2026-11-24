import { MensajesEditor } from "@/components/consultorio/mensajes-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { todayInArgentina } from "@/lib/consultorio/fecha";
import { requireSession } from "@/lib/consultorio/guard";
import { readMensajesTurno } from "@/lib/consultorio/store";

export default async function MensajesPage(props: PageProps<"/consultorio/mensajes">) {
  await requireSession();
  const query = await props.searchParams;
  const mensajes = await readMensajesTurno();

  return (
    <ConsultorioShell current="/consultorio/agenda">
      <MensajesEditor initial={mensajes} volver={destinoInterno(query.volver, "/consultorio/agenda")} hoy={todayInArgentina()} />
    </ConsultorioShell>
  );
}
