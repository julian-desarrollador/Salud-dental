import { createPatient } from "@/app/consultorio/actions";
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
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Pacientes</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <form action={createPatient} className="mt-8 grid gap-3">
        <label className="text-forest" htmlFor="name">
          Nombre del paciente
        </label>
        <input
          id="name"
          name="name"
          required
          className="min-h-12 rounded-xl border border-sand bg-white px-4 text-lg text-forest"
        />
        <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-lg text-cream">
          Nuevo paciente
        </button>
      </form>
      <div className="mt-10">
        <ListaPacientes patients={patients} />
      </div>
    </ConsultorioShell>
  );
}
