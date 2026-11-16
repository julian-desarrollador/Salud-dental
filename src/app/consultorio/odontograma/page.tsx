import { CatalogoEditor } from "@/components/consultorio/catalogo-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";
import { readCatalogoOdontograma } from "@/lib/consultorio/store";

export default async function CatalogoOdontogramaPage(props: PageProps<"/consultorio/odontograma">) {
  await requireSession();
  const query = await props.searchParams;
  const catalogo = await readCatalogoOdontograma();

  return (
    <ConsultorioShell current="/consultorio">
      <CatalogoEditor initial={catalogo} volver={destinoInterno(query.volver, "/consultorio")} />
    </ConsultorioShell>
  );
}
