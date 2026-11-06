import { notFound } from "next/navigation";
import { FichaEditor } from "@/components/consultorio/ficha-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";
import { activeConsentLink, readPreguntasMedicas, readStore } from "@/lib/consultorio/store";

export default async function FichaPage(props: PageProps<"/consultorio/pacientes/[id]">) {
  await requireSession();
  const { id } = await props.params;
  const query = await props.searchParams;
  const store = await readStore();
  const patient = store.patients.find((item) => item.id === id);
  if (!patient) notFound();
  const [token, preguntas] = await Promise.all([activeConsentLink(patient.id), readPreguntasMedicas()]);

  return (
    <ConsultorioShell current="/consultorio/pacientes">
      <FichaEditor
        initial={patient}
        preguntas={preguntas}
        volver={destinoInterno(query.volver)}
        enlaceInicial={token ? `/firmar/${token}` : ""}
      />
    </ConsultorioShell>
  );
}
