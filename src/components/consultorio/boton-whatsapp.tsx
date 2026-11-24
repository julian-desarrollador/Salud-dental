/** Verde de WhatsApp, un poco más oscuro para que el texto blanco se lea bien. */
const VERDE = "#1a9c4b";

/** Logo de WhatsApp (globo con el teléfono). */
export function IconoWhatsapp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0`} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.24-.7.24-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.5 2 2 6.47 2 11.98c0 1.76.46 3.48 1.34 5L2 22l5.15-1.34a10.07 10.07 0 0 0 4.89 1.25h.01c5.53 0 10.03-4.47 10.03-9.98A9.93 9.93 0 0 0 19.12 4.9 9.98 9.98 0 0 0 12.04 2Zm0 18.23h-.01a8.36 8.36 0 0 1-4.26-1.16l-.31-.18-3.06.8.82-2.97-.2-.31a8.2 8.2 0 0 1-1.27-4.43c0-4.58 3.74-8.3 8.3-8.3a8.27 8.27 0 0 1 8.3 8.31c0 4.58-3.73 8.24-8.31 8.24Z" />
    </svg>
  );
}

/**
 * El botón de WhatsApp de toda la aplicación: verde con el logo.
 * `principal` es relleno; si no, borde verde sobre blanco.
 */
export function BotonWhatsapp({
  children,
  onClick,
  principal = true,
  chico = false,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  principal?: boolean;
  /** Para lugares angostos, como las tarjetas de la agenda. */
  chico?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={principal ? { backgroundColor: VERDE, borderColor: VERDE } : { borderColor: VERDE, color: VERDE }}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 font-semibold disabled:cursor-default disabled:opacity-50 ${
        chico ? "min-h-11 px-4 text-base" : "min-h-12 px-5 text-lg"
      } ${principal ? "text-white" : "bg-white"} ${className}`}
    >
      <IconoWhatsapp />
      {children}
    </button>
  );
}
