import {
  NuevoPresupuesto,
  PresupuestosRecientes,
  TarjetaMisPrecios,
  type PresupuestoReciente,
} from "@/components/consultorio/presupuestos-recientes";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { requireSession } from "@/lib/consultorio/guard";
import { tituloPropio, totalDe } from "@/lib/consultorio/presupuesto";
import { readStore } from "@/lib/consultorio/store";

export default async function PresupuestoPage() {
  await requireSession();
  const store = await readStore();

  const recientes: PresupuestoReciente[] = store.patients
    .flatMap((patient) =>
      // Uno recién abierto y sin prestaciones todavía no es un presupuesto para mostrar.
      (patient.presupuestos ?? [])
        .filter((presupuesto) => presupuesto.items.some((item) => item.name.trim()))
        .map((presupuesto) => ({
          patientId: patient.id,
          patientName: patient.name,
          id: presupuesto.id,
          titulo: tituloPropio(presupuesto),
          createdOn: presupuesto.createdOn,
          sentOn: presupuesto.sentOn,
          ...totalDe(presupuesto),
        })),
    )
    .sort((a, b) => b.createdOn.localeCompare(a.createdOn))
    .slice(0, 20);

  const pacientes = store.patients
    .map((patient) => ({ id: patient.id, name: patient.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const categorias = new Set(store.fees.map((fee) => fee.chapter.trim().toLocaleLowerCase("es")).filter(Boolean)).size;

  return (
    <ConsultorioShell current="/consultorio/presupuesto">
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Presupuesto</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">Armá el presupuesto de un paciente con tus precios y mandáselo por WhatsApp.</p>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <NuevoPresupuesto pacientes={pacientes} />
        <TarjetaMisPrecios prestaciones={store.fees.length} categorias={categorias} />
      </div>
      <div className="mt-12">
        <PresupuestosRecientes items={recientes} />
      </div>
    </ConsultorioShell>
  );
}
