import { aWhatsapp, telefonoValido } from "./agenda-horario";

/** Enlace de WhatsApp con el texto ya escrito. Sin un teléfono válido, abre WhatsApp para elegir el contacto. */
export function enlaceWhatsapp(contacto: string, texto: string) {
  const mensaje = encodeURIComponent(texto);
  if (!telefonoValido(contacto)) return `https://wa.me/?text=${mensaje}`;
  const destino = aWhatsapp(contacto).replace(/^whatsapp:\+/, "");
  return `https://wa.me/${destino}?text=${mensaje}`;
}

export function abrirWhatsapp(url: string) {
  const ventana = window.open(url, "_blank");
  if (!ventana) window.location.href = url;
}
