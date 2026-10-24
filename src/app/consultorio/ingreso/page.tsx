import { redirect } from "next/navigation";
import { LoginForm } from "@/components/consultorio/login-form";
import { hasSession } from "@/lib/consultorio/guard";

export default async function IngresoPage() {
  if (await hasSession()) redirect("/consultorio");
  return <LoginForm />;
}
