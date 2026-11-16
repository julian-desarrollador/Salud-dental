import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/consultorio/print-button";
import { ConsultorioShell } from "@/components/consultorio/shell";
import {
  consentSheet,
  defaultCommitment,
  type DatoDeLaHoja,
  type HojaBreve,
  type HojaPropia,
} from "@/lib/consultorio/consents";
import { destinoInterno } from "@/lib/consultorio/destino";
import { requireSession } from "@/lib/consultorio/guard";

const PROFESIONAL = "Od. Jesica Brenda Goroso";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function Renglon({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 min-h-8 border-b border-sand pb-1">{value || " "}</dd>
    </div>
  );
}

/** Hoja con el texto de Jesica, tal cual lo escribió. */
function TextoPropio({ sheet, name, datos }: { sheet: HojaPropia; name: string; datos: Record<DatoDeLaHoja, string> }) {
  return (
    <>
      <dl className="mt-8 grid gap-x-8 gap-y-4 text-base sm:grid-cols-2 print:mt-4 print:gap-y-2">
        <div className="sm:col-span-2">
          <Renglon label="Paciente" value={name} />
        </div>
        {sheet.fields.map((field) => (
          <Renglon key={field.label} label={field.label} value={field.dato ? datos[field.dato] : ""} />
        ))}
      </dl>

      {sheet.sections.map((section, index) => (
        <section key={section.title} className="break-inside-avoid-page">
          <h2 className="mt-7 font-serif text-xl print:mt-4">
            {index + 1}. {section.title}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-base leading-6 print:mt-1 print:text-[11pt] print:leading-[1.4]">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {sheet.blanks.map((blank) => (
        <div key={blank.label} className="mt-8 break-inside-avoid print:mt-4">
          <p className="font-semibold">{blank.label}:</p>
          {Array.from({ length: blank.lines }, (_, line) => (
            <div key={line} className="h-9 border-b border-forest print:h-8" />
          ))}
        </div>
      ))}

      <div className="mt-10 grid break-inside-avoid gap-x-10 gap-y-8 sm:grid-cols-2 print:mt-5 print:gap-y-4">
        {sheet.signatures.map((group, index) => (
          <div key={index} className="space-y-6 print:space-y-4">
            {group.map((label, line) => (
              <div key={line}>
                <div className="h-12 border-b border-forest print:h-10" />
                <p className="mt-2 text-base">{label}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/** Hoja breve: en qué consiste, qué puede pasar y otras posibilidades. */
function TextoBreve({ sheet, name }: { sheet: HojaBreve; name: string }) {
  return (
    <>
      <p className="mt-6 text-base leading-6">
        {sheet.minor
          ? `${PROFESIONAL} me explicó en qué consiste la práctica, qué puede pasar y qué otras opciones hay. Pude hacer preguntas. Firmo para dejar constancia de que entendí y acepto el tratamiento indicado. Si el paciente es menor de edad, firmo como su madre, padre o tutor.`
          : `${PROFESIONAL} me explicó en qué consiste la práctica, qué puede pasar y qué otras opciones hay. Pude hacer preguntas. Firmo para dejar constancia de que entendí y acepto el tratamiento indicado para mi caso.`}
      </p>
      <p className="mt-3 text-base leading-6">
        Consultorio en San Lorenzo 2908 (entre Hipólito Yrigoyen y La Rioja), Mar del Plata.
      </p>

      <dl className="mt-8 space-y-4 text-base">
        <Renglon label="Paciente" value={name} />
        <Renglon label="Documento" />
        <Renglon label="Práctica" value={sheet.practice} />
        {sheet.minor ? (
          <>
            <Renglon label="Si es menor de edad: madre, padre o tutor (nombre y vínculo)" />
            <Renglon label="Documento de quien firma" />
          </>
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

      <p className="mt-8 text-base leading-6">{sheet.commitment ?? defaultCommitment}</p>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <div className="h-12 border-b border-forest" />
          <p className="mt-2 text-base">{sheet.minor ? "Firma del paciente o de quien lo representa" : "Firma del paciente"}</p>
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
    </>
  );
}

export default async function ConsentimientoPage(props: PageProps<"/consultorio/consentimientos/[kind]">) {
  await requireSession();
  const { kind } = await props.params;
  const sheet = consentSheet(kind);
  if (!sheet) notFound();
  const query = await props.searchParams;
  const name = one(query.nombre).slice(0, 120);
  const datos: Record<DatoDeLaHoja, string> = {
    dni: one(query.dni).slice(0, 30),
    nacimiento: one(query.nacimiento).slice(0, 30),
    profesional: PROFESIONAL,
  };
  // Vuelve a la ficha si se llegó desde ahí; si no, a la lista de hojas.
  const volver = destinoInterno(query.volver, "/consultorio/consentimientos");

  return (
    <ConsultorioShell current="/consultorio/consentimientos">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-4 print:hidden">
        <Link href={volver} className="inline-flex h-11 items-center justify-center rounded-2xl border border-sand bg-white px-4 text-forest">
          Atrás
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white px-2 py-2 text-base leading-relaxed text-forest sm:px-8 sm:py-6 print:max-w-none print:px-0 print:text-[12pt]">
        {sheet.draft ? (
          <p role="note" className="mb-6 rounded-xl border-2 border-[#b3261e] px-4 py-3 font-semibold text-[#b3261e]">
            Borrador: falta el texto de Jesica. No usar para que firme un paciente.
          </p>
        ) : null}
        <p className="text-base uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
        <h1 className="mt-3 font-serif text-4xl print:mt-2 print:text-3xl">{sheet.title}</h1>
        <span className="mt-4 block h-0.5 w-16 bg-gold print:bg-forest" />
        {"sections" in sheet ? <TextoPropio sheet={sheet} name={name} datos={datos} /> : <TextoBreve sheet={sheet} name={name} />}
      </article>
      <p className="mx-auto mt-8 max-w-3xl text-forest print:hidden">
        Para imprimir, es más cómodo desde la computadora del consultorio.
      </p>
    </ConsultorioShell>
  );
}
