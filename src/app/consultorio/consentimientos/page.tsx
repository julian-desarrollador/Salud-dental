import Link from "next/link";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { HOJAS_EDITABLES, NOMBRE_HOJA } from "@/lib/consultorio/consents";
import { requireSession } from "@/lib/consultorio/guard";

export default async function ConsentimientosPage() {
  await requireSession();

  return (
    <ConsultorioShell current="/consultorio/consentimientos">
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Consentimientos</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">Los textos que leen y firman tus pacientes.</p>
      <ul className="mt-8 max-w-2xl divide-y divide-sand rounded-2xl border border-sand bg-white">
        {HOJAS_EDITABLES.map((kind) => (
          <li key={kind}>
            <Link
              href={`/consultorio/consentimientos/${kind}`}
              className="flex min-h-16 items-center justify-between gap-4 px-5 font-serif text-2xl text-forest"
            >
              {NOMBRE_HOJA[kind]}
              <span aria-hidden="true" className="font-sans text-2xl text-muted">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ConsultorioShell>
  );
}
