import { PrestacionesEditor } from "@/components/consultorio/prestaciones-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { requireSession } from "@/lib/consultorio/guard";
import { readStore } from "@/lib/consultorio/store";

export default async function PrestacionesPage() {
  await requireSession();
  const store = await readStore();

  return (
    <ConsultorioShell current="/consultorio/prestaciones">
      <PrestacionesEditor initial={store.fees} />
    </ConsultorioShell>
  );
}
