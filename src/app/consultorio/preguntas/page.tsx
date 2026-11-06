import { PreguntasEditor } from "@/components/consultorio/preguntas-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";
import { readPreguntasMedicas } from "@/lib/consultorio/store";

export default async function PreguntasPage(props: PageProps<"/consultorio/preguntas">) {
  await requireSession();
  const query = await props.searchParams;
  const preguntas = await readPreguntasMedicas();

  return (
    <ConsultorioShell current="/consultorio">
      <PreguntasEditor initial={preguntas} volver={destinoInterno(query.volver, "/consultorio")} />
    </ConsultorioShell>
  );
}
