import Link from "next/link";
import { ConsultorioShell } from "@/components/consultorio/shell";
import { requireSession } from "@/lib/consultorio/guard";
import { readStore } from "@/lib/consultorio/store";

const doors = [
  {
    href: "/consultorio/agenda",
    title: "Agenda",
    text: "Cargá los turnos del consultorio",
  },
  {
    href: "/consultorio/pacientes",
    title: "Pacientes",
    text: "Fichas, visitas y dientes",
  },
  {
    href: "/consultorio/prestaciones",
    title: "Mis precios",
    text: "Lo que cobrás por cada práctica",
  },
  {
    href: "/consultorio/consentimientos",
    title: "Hojas para firmar",
    text: "Para imprimir en la computadora",
  },
] as const;

export default async function ConsultorioHome() {
  await requireSession();
  const store = await readStore();
  const count = store.patients.length;

  return (
    <ConsultorioShell current="/consultorio">
      <h1 className="font-serif text-4xl text-forest md:text-5xl">Consultorio</h1>
      <span className="mt-4 block h-0.5 w-16 bg-gold" />
      <p className="mt-6 text-forest">Solo vos ves esto.</p>
      <div className="mt-8 grid gap-4">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="block rounded-2xl border border-sand bg-white px-6 py-6"
          >
            <span className="block font-serif text-4xl text-forest">{door.title}</span>
            <span className="mt-2 block text-forest">
              {door.href === "/consultorio/pacientes"
                ? count === 0
                  ? "Todavía no hay fichas."
                  : `${count} ${count === 1 ? "ficha" : "fichas"}. ${door.text}`
                : door.text}
            </span>
          </Link>
        ))}
      </div>
    </ConsultorioShell>
  );
}
