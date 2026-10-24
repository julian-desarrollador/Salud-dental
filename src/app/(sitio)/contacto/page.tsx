import Contact from "@/components/site/Contact";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/contacto");

export default async function Page(props: PageProps<"/contacto">) {
  const query = await props.searchParams;
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  return <Contact fromConsultar={from === "consultar"} />;
}
