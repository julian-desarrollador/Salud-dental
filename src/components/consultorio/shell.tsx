import Link from "next/link";
import { SalirButton } from "@/components/consultorio/salir-button";

const links = [
  { href: "/consultorio", label: "Inicio", short: "Inicio", icon: "home" },
  { href: "/consultorio/agenda", label: "Agenda", short: "Agenda", icon: "calendar" },
  { href: "/consultorio/pacientes", label: "Pacientes", short: "Pacientes", icon: "person" },
  { href: "/consultorio/prestaciones", label: "Mis precios", short: "Precios", icon: "tag" },
  { href: "/consultorio/consentimientos", label: "Hojas para firmar", short: "Firmar", icon: "sheet" },
] as const;

function TabIcon({ name, filled }: { name: (typeof links)[number]["icon"]; filled: boolean }) {
  const common = "h-6 w-6";
  if (name === "home") {
    return filled ? (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M12 3.2 3 10.2V20a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1V10.2L12 3.2Z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }
  if (name === "person") {
    return filled ? (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M12 12.2a4.1 4.1 0 1 0-4.1-4.1A4.1 4.1 0 0 0 12 12.2Zm0 2.1c-3.4 0-7.2 1.7-7.2 4.2V21h14.4v-2.5c0-2.5-3.8-4.2-7.2-4.2Z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common} fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.25" />
        <path strokeLinecap="round" d="M5.5 19.5v-.4c0-2.3 2.6-3.8 6.5-3.8s6.5 1.5 6.5 3.8v.4" />
      </svg>
    );
  }
  if (name === "calendar") {
    return filled ? (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M7 2.8h2v2.2h6V2.8h2v2.2h2.2A1.8 1.8 0 0 1 21 6.8v12.4A1.8 1.8 0 0 1 19.2 21H4.8A1.8 1.8 0 0 1 3 19.2V6.8A1.8 1.8 0 0 1 4.8 5H7V2.8Zm12.2 7.4H4.8v9h14.4v-9Z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common} fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3.8" y="4.8" width="16.4" height="15" rx="1.6" />
        <path strokeLinecap="round" d="M8 3.2v3.2M16 3.2v3.2M3.8 9.2h16.4" />
      </svg>
    );
  }
  if (name === "tag") {
    return filled ? (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M12.6 3.5H4.8A1.3 1.3 0 0 0 3.5 4.8v7.8c0 .4.1.7.4 1L12.7 22a1.3 1.3 0 0 0 1.8 0l7.5-7.5a1.3 1.3 0 0 0 0-1.8L13.6 3.9a1.3 1.3 0 0 0-1-.4Zm-4.3 5.2a1.35 1.35 0 1 1 1.35-1.35A1.35 1.35 0 0 1 8.3 8.7Z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={common} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinejoin="round" d="M11.2 4.2H5.2v6L13.4 18.4a1.2 1.2 0 0 0 1.7 0l3.3-3.3a1.2 1.2 0 0 0 0-1.7L11.2 4.2Z" />
        <circle cx="8.2" cy="8.2" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return filled ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
      <path fill="currentColor" d="M6 3.5h8.2L19.5 8.8V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5Zm7.5 1.8V9H17l-3.5-3.7ZM8 12.2h8v1.5H8v-1.5Zm0 3.2h6.2v1.5H8v-1.5Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={common} fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinejoin="round" d="M7 4.2h7.2L18.8 9v10.3a1.2 1.2 0 0 1-1.2 1.2H7a1.2 1.2 0 0 1-1.2-1.2V5.4A1.2 1.2 0 0 1 7 4.2Z" />
      <path strokeLinejoin="round" d="M14 4.4V9h4.4" />
      <path strokeLinecap="round" d="M8.2 12.5h7.2M8.2 15.8h5.2" />
    </svg>
  );
}

export function ConsultorioShell({
  children,
  current,
}: {
  children: React.ReactNode;
  current?: string;
}) {
  return (
    <div className="min-h-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="border-b border-sand bg-cream px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="font-serif text-3xl leading-none text-forest">Consultorio</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-forest md:inline">
              Ver la página
            </Link>
            <SalirButton />
          </div>
        </div>
        <nav aria-label="Consultorio" className="mx-auto mt-4 hidden max-w-6xl md:block">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current === link.href ? "page" : undefined}
                  className={`inline-flex h-12 items-center ${current === link.href ? "text-forest underline decoration-gold underline-offset-8" : "text-forest"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      <nav
        aria-label="Consultorio"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
      >
        <ul className="grid grid-cols-5">
          {links.map((link) => {
            const active = current === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 whitespace-nowrap text-sm ${active ? "text-forest" : "text-muted"}`}
                >
                  <TabIcon name={link.icon} filled={active} />
                  {link.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
