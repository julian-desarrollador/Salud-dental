import { redirect } from "next/navigation";

/** "Mis precios" ahora vive dentro de Presupuesto. */
export default function PrestacionesPage() {
  redirect("/consultorio/presupuesto/precios");
}
