import { notFound } from "next/navigation";
import { FichaEditor } from "@/components/consultorio/ficha-editor";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { requireSession } from "@/lib/consultorio/guard";
import { activeConsentLink, readStore } from "@/lib/consultorio/store";

function destinoInterno(value: string | string[] | undefined) {
  const pedido = Array.isArray(value) ? value[0] : value;
  if (!pedido || !pedido.startsWith("/consultorio/") || pedido.startsWith("//") || pedido.includes("\\")) {
    return "/consultorio/pacientes";
  }
  return pedido;
}

export default async function FichaPage(props: PageProps<"/consultorio/pacientes/[id]">) {
  await requireSession();
  const { id } = await props.params;
  const query = await props.searchParams;
  const store = await readStore();
  const patient = store.patients.find((item) => item.id === id);
  if (!patient) notFound();
  const token = await activeConsentLink(patient.id);

  return (
    <ConsultorioShell current="/consultorio/pacientes">
      <FichaEditor initial={patient} volver={destinoInterno(query.volver)} enlaceInicial={token ? `/firmar/${token}` : ""} />
    </ConsultorioShell>
  );
}
