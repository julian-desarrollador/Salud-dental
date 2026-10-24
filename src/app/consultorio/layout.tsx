import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consultorio",
  applicationName: "Consultorio",
  robots: { index: false, follow: false },
  manifest: "/consultorio/manifest",
  appleWebApp: {
    capable: true,
    title: "Consultorio",
    statusBarStyle: "default",
  },
};

export default function ConsultorioLayout({ children }: LayoutProps<"/consultorio">) {
  return <div className="consultorio-ui">{children}</div>;
}
