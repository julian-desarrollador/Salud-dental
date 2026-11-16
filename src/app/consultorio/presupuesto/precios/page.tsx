import { PreciosPlanilla } from "@/components/consultorio/precios-planilla";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";
import { readStore } from "@/lib/consultorio/store";

export default async function MisPreciosPage(props: PageProps<"/consultorio/presupuesto/precios">) {
  await requireSession();
  const query = await props.searchParams;
  const store = await readStore();

  return (
    <ConsultorioShell current="/consultorio/presupuesto">
      <PreciosPlanilla initial={store.fees} volver={destinoInterno(query.volver, "/consultorio/presupuesto")} />
    </ConsultorioShell>
  );
}
