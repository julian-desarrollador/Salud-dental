import { notFound } from "next/navigation";
import { FichaEditor } from "@/components/consultorio/ficha-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";
import { activeConsentLinks, readCatalogoOdontograma, readPreguntasMedicas, readStore } from "@/lib/consultorio/store";

export default async function FichaPage(props: PageProps<"/consultorio/pacientes/[id]">) {
  await requireSession();
  const { id } = await props.params;
  const query = await props.searchParams;
  const store = await readStore();
  const patient = store.patients.find((item) => item.id === id);
  if (!patient) notFound();
  const [enlaces, preguntas, catalogo] = await Promise.all([
    activeConsentLinks(patient.id),
    readPreguntasMedicas(),
    readCatalogoOdontograma(),
  ]);

  return (
    <ConsultorioShell current="/consultorio/pacientes">
      <FichaEditor
        initial={patient}
        preguntas={preguntas}
        catalogo={catalogo}
        precios={store.fees}
        volver={destinoInterno(query.volver)}
        enlaces={enlaces}
        tabInicial={typeof query.tab === "string" ? query.tab : undefined}
        nuevoPresupuesto={query.tab === "presupuestos" && query.nuevo === "1"}
      />
    </ConsultorioShell>
  );
}
