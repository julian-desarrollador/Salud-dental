import About from "@/components/site/About";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/sobre-mi");

export default function Page() {
  return <About />;
}
