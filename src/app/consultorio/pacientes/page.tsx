import { ListaPacientes } from "@/components/consultorio/lista-pacientes";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { requireSession } from "@/lib/consultorio/guard";
import { readStore } from "@/lib/consultorio/store";

export default async function PacientesPage() {
  await requireSession();
  const store = await readStore();
  const patients = [...store.patients].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <ConsultorioShell current="/consultorio/pacientes">
      <ListaPacientes patients={patients} />
    </ConsultorioShell>
  );
}
