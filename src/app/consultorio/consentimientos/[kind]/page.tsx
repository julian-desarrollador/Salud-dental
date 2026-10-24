import { notFound } from "next/navigation";
import { PrintButton } from "@/components/consultorio/print-button";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { consentSheet } from "@/lib/consultorio/consents";
import { requireSession } from "@/lib/consultorio/guard";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ConsentimientoPage(props: PageProps<"/consultorio/consentimientos/[kind]">) {
  await requireSession();
  const { kind } = await props.params;
  const sheet = consentSheet(kind);
  if (!sheet) notFound();
  const query = await props.searchParams;
  const name = one(query.nombre).slice(0, 120);

  return (
    <ConsultorioShell current="/consultorio/consentimientos">
      <div className="mx-auto mb-6 flex max-w-3xl justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white px-2 py-2 text-base leading-relaxed text-forest sm:px-8 sm:py-6 print:max-w-none print:px-0 print:text-[12pt]">
        <p className="text-base uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
        <h1 className="mt-3 font-serif text-4xl">{sheet.title}</h1>
        <span className="mt-4 block h-0.5 w-16 bg-gold print:bg-forest" />
        <p className="mt-6 text-base leading-6">
          Od. Jesica Brenda Goroso me explicó en qué consiste la práctica, qué puede pasar y qué otras opciones hay. Pude hacer preguntas. Firmo para dejar constancia de que entendí y acepto el tratamiento indicado para mi caso.
        </p>
        <p className="mt-3 text-base leading-6">
          Consultorio en San Lorenzo 2908 (entre Hipólito Yrigoyen y La Rioja), Mar del Plata.
        </p>

        <dl className="mt-8 space-y-4 text-base">
          <div>
            <dt className="text-muted">Paciente</dt>
            <dd className="mt-1 border-b border-sand pb-1">{name || " "}</dd>
          </div>
          <div>
            <dt className="text-muted">Documento</dt>
            <dd className="mt-1 border-b border-sand pb-1">&nbsp;</dd>
          </div>
          <div>
            <dt className="text-muted">Práctica</dt>
            <dd className="mt-1 border-b border-sand pb-1">{sheet.practice}</dd>
          </div>
          {sheet.kind === "cirugia" ? (
            <div>
              <dt className="text-muted">Detalle de este caso</dt>
              <dd className="mt-1 h-10 border-b border-sand" />
            </div>
          ) : null}
        </dl>

        <h2 className="mt-8 font-serif text-2xl">En qué consiste</h2>
        <p className="mt-3 text-base leading-6">{sheet.consists}</p>

        <h2 className="mt-8 font-serif text-2xl">Qué puede pasar</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-6">
          {sheet.risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>

        <h2 className="mt-8 font-serif text-2xl">Otras posibilidades</h2>
        <p className="mt-3 text-base leading-6">{sheet.alternatives}</p>

        <p className="mt-8 text-base leading-6">
          Me comprometo a avisar si aparece dolor fuerte, sangrado, fiebre o hinchazón que no cede, y a seguir las indicaciones de cuidado. Puedo retirar mi consentimiento antes de que se realice la práctica.
        </p>

        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <div className="h-12 border-b border-forest" />
            <p className="mt-2 text-base">Firma del paciente</p>
          </div>
          <div>
            <div className="h-12 border-b border-forest" />
            <p className="mt-2 text-base">Firma de la profesional</p>
          </div>
          <div>
            <div className="h-8 border-b border-forest" />
            <p className="mt-2 text-base">Aclaración</p>
          </div>
          <div>
            <div className="h-8 border-b border-forest" />
            <p className="mt-2 text-base">Fecha y lugar</p>
          </div>
        </div>
      </article>
      <p className="mx-auto mt-8 max-w-3xl text-forest print:hidden">
        Para imprimir, es más cómodo desde la computadora del consultorio.
      </p>
    </ConsultorioShell>
  );
}
