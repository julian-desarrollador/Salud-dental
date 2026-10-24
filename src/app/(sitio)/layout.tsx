import { Suspense } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ScrollToTop from "@/components/ScrollToTop";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "Dra. Jesica Brenda Goroso - Salud Dental",
  image: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749842376/jesica_exuyvz.webp",
  url: "https://salud-dental.vercel.app/",
  telephone: "+54-223-616-0437",
  email: "saluddentaljg@gmail.com",
  priceRange: "$$",
  description:
    "Odontóloga en Mar del Plata. Especialista en ortodoncia, ortopedia maxilar, odontología estética y tratamientos para niños, adolescentes y adultos.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "San Lorenzo 2908",
    addressLocality: "Mar del Plata",
    addressRegion: "Buenos Aires",
    addressCountry: "AR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -38.009915326287235,
    longitude: -57.56182889714035,
  },
  areaServed: {
    "@type": "City",
    name: "Mar del Plata",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "13:30", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "17:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "13:30", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "17:00" },
  ],
  knowsAbout: [
    "Ortodoncia",
    "Ortopedia maxilar",
    "Estética dental",
    "Blanqueamiento dental",
    "Prótesis dental",
    "Odontología infantil",
  ],
};

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="gtag-src" src="https://www.googletagmanager.com/gtag/js?id=G-X0ZLVK8D41" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-X0ZLVK8D41');`}
      </Script>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      <ScrollToTop />
      <div className="min-h-screen bg-white">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
      <Analytics />
      <FloatingWhatsApp />
    </>
  );
}
