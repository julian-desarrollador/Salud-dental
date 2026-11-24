import { notFound } from "next/navigation";
import { ConsentimientoEditor } from "@/components/consultorio/consentimiento-editor";
import { OdontogramaPiezasLectura } from "@/components/consultorio/odontograma-lectura";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { ApartadosDelTexto } from "@/components/consultorio/texto-consentimiento";
import {
  NOMBRE_HOJA,
  esHojaEditable,
  hojaPropiaPorWhatsapp,
  textoDeFabrica,
  type DatoDeLaHoja,
  type HojaPropia,
  type TextoConsentimiento,
} from "@/lib/consultorio/consents";
import { destinoInterno } from "@/lib/consultorio/destino";
import { horaFirmada } from "@/lib/consultorio/fecha";
import { requireSession } from "@/lib/consultorio/guard";
import { readStore, readTexto } from "@/lib/consultorio/store";
import type { SignedConsent } from "@/lib/consultorio/types";

const PROFESIONAL = "Od. Jesica Brenda Goroso";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function fechaCorta(iso: string) {
  return iso.split("-").reverse().join("/");
}

function Renglon({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 min-h-8 border-b border-sand pb-1">{value || " "}</dd>
    </div>
  );
}

/** Una línea de firma: lo escrito o la imagen arriba de la línea y la etiqueta abajo. */
function LineaDeFirma({ label, children, alta = false }: { label: string; children?: React.ReactNode; alta?: boolean }) {
  return (
    <div>
      <div className={`flex items-end border-b border-forest pb-1 ${alta ? "h-24 print:h-20" : "h-12 print:h-10"}`}>{children}</div>
      <p className="mt-2 text-base">{label}</p>
    </div>
  );
}

function ImagenDeFirma({ fileId }: { fileId: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/consultorio/archivo/${fileId}`} alt="Firma" className="h-24 w-auto object-contain print:h-20" />;
}

/** De la firma hecha en el teléfono: qué va en cada renglón del representante. */
function datoDelRepresentante(label: string, firmada?: SignedConsent) {
  if (firmada?.firmante !== "representante") return "";
  if (label === "Padre, madre o representante legal") return firmada.aclaracion ?? "";
  if (label === "DNI del representante") return firmada.dniFirmante ?? "";
  return "";
}

/** ¿Este grupo de firmas es el de quien firmó en el teléfono? */
function esGrupoDelFirmante(group: string[], firmada?: SignedConsent) {
  const primera = group[0] ?? "";
  if (firmada?.firmante === "paciente") return primera.startsWith("Firma del paciente");
  if (firmada?.firmante === "representante") return primera.startsWith("Firma del padre");
  return false;
}

/** Ortodoncia y Ortopedia: datos, apartados, espacios y firmas. Con `firmada`, lo que se firmó en el teléfono. */
function HojaPropiaVista({
  sheet,
  texto,
  name,
  datos,
  firmada,
}: {
  sheet: HojaPropia;
  texto: TextoConsentimiento;
  name: string;
  datos: Record<DatoDeLaHoja, string>;
  firmada?: SignedConsent;
}) {
  const notas = new Map((firmada?.notas ?? []).map((nota) => [nota.label, nota.texto]));
  const aclaracionYDni = [firmada?.aclaracion, firmada?.dniFirmante ? `DNI ${firmada.dniFirmante}` : ""].filter(Boolean).join(" · ");
  return (
    <>
      <dl className="mt-8 grid gap-x-8 gap-y-4 text-base sm:grid-cols-2 print:mt-4 print:gap-y-2">
        <div className="sm:col-span-2">
          <Renglon label="Paciente" value={name} />
        </div>
        {sheet.fields.map((field) => (
          <Renglon
            key={field.label}
            label={field.label}
            value={field.dato ? datos[field.dato] : datoDelRepresentante(field.label, firmada)}
          />
        ))}
      </dl>

      <ApartadosDelTexto texto={texto} compacto />

      {sheet.blanks.map((blank) => (
        <div key={blank.label} className="mt-8 break-inside-avoid print:mt-4">
          <p className="font-semibold">{blank.label}:</p>
          {notas.get(blank.label) ? (
            <p className="mt-1 whitespace-pre-wrap border-b border-forest pb-1">{notas.get(blank.label)}</p>
          ) : (
            Array.from({ length: blank.lines }, (_, line) => <div key={line} className="h-9 border-b border-forest print:h-8" />)
          )}
        </div>
      ))}

      <div className="mt-10 grid break-inside-avoid gap-x-10 gap-y-8 sm:grid-cols-2 print:mt-5 print:gap-y-4">
        {sheet.signatures.map((group, index) => {
          const delFirmante = esGrupoDelFirmante(group, firmada);
          const tieneAclaracion = group.some((label) => label.startsWith("Aclaración"));
          return (
            <div key={index} className="space-y-6 print:space-y-4">
              {group.map((label, line) => {
                const conFirma = delFirmante && line === 0 && Boolean(firmada?.fileId);
                return (
                  <div key={line}>
                    <LineaDeFirma label={label} alta={conFirma}>
                      {firmada && label === "Lugar y fecha"
                        ? `Mar del Plata, ${fechaCorta(firmada.signedOn)}`
                        : conFirma && firmada?.fileId
                          ? <ImagenDeFirma fileId={firmada.fileId} />
                          : delFirmante && label.startsWith("Aclaración")
                            ? aclaracionYDni
                            : null}
                    </LineaDeFirma>
                    {conFirma && !tieneAclaracion && aclaracionYDni ? <p className="text-base">{aclaracionYDni}</p> : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Odontología general: paciente, texto, odontograma al firmar y firmas. */
function HojaGeneralVista({ texto, name, firmada }: { texto: TextoConsentimiento; name: string; firmada?: SignedConsent }) {
  return (
    <>
      <dl className="mt-8 text-base print:mt-4">
        <Renglon label="Paciente" value={name} />
      </dl>
      <ApartadosDelTexto texto={texto} compacto />
      {firmada?.piezasSnapshot ? (
        <div className="mt-8 break-inside-avoid print:mt-4">
          <p className="font-semibold">Odontograma al firmar</p>
          <div className="mt-3">
            <OdontogramaPiezasLectura piezas={firmada.piezasSnapshot} />
          </div>
        </div>
      ) : null}
      <div className="mt-10 grid break-inside-avoid gap-x-10 gap-y-8 sm:grid-cols-2 print:mt-5 print:gap-y-4">
        <LineaDeFirma label="Firma del paciente" alta={Boolean(firmada?.fileId)}>
          {firmada?.fileId ? <ImagenDeFirma fileId={firmada.fileId} /> : null}
        </LineaDeFirma>
        <LineaDeFirma label="Aclaración">{firmada?.aclaracion ?? null}</LineaDeFirma>
        <LineaDeFirma label="Lugar y fecha">{firmada ? `Mar del Plata, ${fechaCorta(firmada.signedOn)}` : null}</LineaDeFirma>
        <LineaDeFirma label="Firma y sello del profesional" />
      </div>
    </>
  );
}

export default async function ConsentimientoPage(props: PageProps<"/consultorio/consentimientos/[kind]">) {
  await requireSession();
  const { kind } = await props.params;
  if (!esHojaEditable(kind)) notFound();
  const sheet = kind === "general" ? undefined : hojaPropiaPorWhatsapp(kind);
  if (kind !== "general" && !sheet) notFound();
  const query = await props.searchParams;
  const vigente = await readTexto(kind);
  const fabrica = textoDeFabrica(kind);

  let name = one(query.nombre).slice(0, 120);
  const datos: Record<DatoDeLaHoja, string> = {
    dni: one(query.dni).slice(0, 30),
    nacimiento: one(query.nacimiento).slice(0, 30),
    profesional: PROFESIONAL,
  };
  // Con ?paciente=…, la hoja sale con los datos de la ficha y, si se firmó en el teléfono, con esa firma.
  let firmada: SignedConsent | undefined;
  const pacienteId = one(query.paciente);
  if (pacienteId) {
    const patient = (await readStore()).patients.find((item) => item.id === pacienteId);
    if (patient) {
      name = patient.name;
      datos.dni = patient.document ?? "";
      datos.nacimiento = patient.birthDate ? fechaCorta(patient.birthDate) : "";
      firmada = (patient.consents ?? []).find((item) => item.kind === kind && item.source === "pantalla");
    }
  }

  // Lo firmado se muestra con el texto que leyó el paciente: su copia o, en las firmas viejas, el de fábrica.
  const texto: TextoConsentimiento = firmada
    ? (firmada.texto ?? (firmada.textVersion === fabrica.version ? fabrica : vigente))
    : vigente;
  const versionAnterior = Boolean(firmada && !firmada.texto && firmada.textVersion !== fabrica.version && firmada.textVersion !== vigente.version);
  const hora = horaFirmada(firmada?.signedAt);
  // Vuelve a la ficha si se llegó desde ahí; si no, a la lista de consentimientos.
  const volver = destinoInterno(query.volver, "/consultorio/consentimientos");

  return (
    <ConsultorioShell current="/consultorio/consentimientos">
      <ConsentimientoEditor
        kind={kind}
        nombre={NOMBRE_HOJA[kind]}
        texto={vigente}
        original={fabrica}
        volver={volver}
        editable={!pacienteId}
      >
        <article className="mx-auto max-w-3xl bg-white px-2 py-2 text-base leading-relaxed text-forest sm:px-8 sm:py-6 print:max-w-none print:px-0 print:text-[12pt]">
          <p className="text-base uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
          <h1 className="mt-3 font-serif text-4xl print:mt-2 print:text-3xl">{texto.titulo}</h1>
          <span className="mt-4 block h-0.5 w-16 bg-gold print:bg-forest" />
          {firmada ? (
            <p role="note" className="mt-6 rounded-xl border border-sand bg-cream px-4 py-3 print:mt-3 print:py-2">
              Firmado por WhatsApp el {fechaCorta(firmada.signedOn)}
              {hora ? ` a las ${hora}` : ""}
              {hora.endsWith(".") ? "" : "."}
              {versionAnterior ? " Firmado con una versión anterior del texto." : ""}
            </p>
          ) : null}
          {sheet ? (
            <HojaPropiaVista sheet={sheet} texto={texto} name={name} datos={datos} firmada={firmada} />
          ) : (
            <HojaGeneralVista texto={texto} name={name} firmada={firmada} />
          )}
        </article>
      </ConsentimientoEditor>
    </ConsultorioShell>
  );
}
