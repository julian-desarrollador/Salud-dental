import Appointments from "@/components/site/Appointments";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/turnos");

export default function Page() {
  return <Appointments />;
}
