import type { Metadata } from "next";
import { routeSeo, SITE_URL, type RouteSeo } from "./seo";

export function pageMetadata(path: keyof typeof routeSeo): Metadata {
  const seo: RouteSeo = routeSeo[path];
  const url = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      locale: "es_AR",
      type: "website",
      siteName: "Salud Dental - Dra. Jesica Goroso",
    },
  };
}
