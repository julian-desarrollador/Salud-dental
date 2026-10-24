import Link from "next/link";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { consentSheets } from "@/lib/consultorio/consents";
import { requireSession } from "@/lib/consultorio/guard";

export default async function ConsentimientosPage() {
  await requireSession();

  return (
    <ConsultorioShell current="/consultorio/consentimientos">
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Hojas para firmar</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">
        Imprimir es más cómodo desde la computadora del consultorio. En el celular, subí la foto de la hoja firmada desde la ficha del paciente.
      </p>
      <ul className="mt-8 space-y-4">
        {consentSheets.map((sheet) => (
          <li key={sheet.kind} className="rounded-2xl border border-sand bg-white p-6">
            <h2 className="font-serif text-3xl">{sheet.practice}</h2>
            <Link
              href={`/consultorio/consentimientos/${sheet.kind}`}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-forest px-5 text-lg text-cream"
            >
              Imprimir
            </Link>
          </li>
        ))}
      </ul>
    </ConsultorioShell>
  );
}
