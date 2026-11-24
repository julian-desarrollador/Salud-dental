import Link from "next/link";

const clases =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-sand bg-white pl-3 pr-4 text-forest print:hidden";

/** El único botón para volver del consultorio: flecha + "Atrás". Lleva a `href`, o hace `onClick` (un paso atrás). */
export function BotonAtras(
  props: { className?: string } & ({ href: string; scroll?: boolean } | { onClick: () => void }),
) {
  const className = props.className ? `${clases} ${props.className}` : clases;
  const contenido = (
    <>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Atrás
    </>
  );
  if ("onClick" in props) {
    return (
      <button type="button" onClick={props.onClick} className={className}>
        {contenido}
      </button>
    );
  }
  return (
    <Link href={props.href} scroll={props.scroll} className={className}>
      {contenido}
    </Link>
  );
}
