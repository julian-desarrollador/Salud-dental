import Services from "@/components/site/Services";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/servicios");

export default function Page() {
  return <Services />;
}
