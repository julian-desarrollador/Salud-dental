import Results from "@/components/site/Results";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/resultados");

export default function Page() {
  return <Results />;
}
