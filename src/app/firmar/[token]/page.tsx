import type { Metadata } from "next";
import { FirmaPad } from "@/components/consultorio/firma-pad";
import { consentLinkView } from "@/lib/consultorio/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consentimiento informado",
  robots: { index: false, follow: false },
};

export default async function FirmarPage(props: PageProps<"/firmar/[token]">) {
  const { token } = await props.params;
  const view = await consentLinkView(token);

  return (
    <div className="consultorio-ui min-h-full bg-cream px-4 py-8 text-forest">
      {view ? (
        <FirmaPad name={view.name} teeth={view.teeth} token={token} />
      ) : (
        <div className="mx-auto max-w-3xl rounded-[22px] border border-sand bg-white p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Salud Dental · Mar del Plata</p>
          <h1 className="mt-2 font-serif text-4xl">Este enlace ya no sirve</h1>
          <p className="mt-4 text-lg">Pedile a la doctora un enlace nuevo.</p>
        </div>
      )}
    </div>
  );
}
