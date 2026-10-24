import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const siteUrl = "https://salud-dental.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dra. Jesica Goroso | Odontóloga en Mar del Plata | Salud Dental",
  description:
    "Consultorio odontológico de la Dra. Jesica Goroso en Mar del Plata. Ortodoncia, ortopedia maxilar, estética dental, blanqueamiento y odontología para niños y adultos. Reservá tu turno.",
  icons: {
    icon: "https://res.cloudinary.com/dzoupwn0e/image/upload/v1754952285/logo_salud_dental_verde_ndyrmh.webp",
    apple: "https://res.cloudinary.com/dzoupwn0e/image/upload/v1754952285/logo_salud_dental_verde_ndyrmh.webp",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-gray-900">{children}</body>
    </html>
  );
}
