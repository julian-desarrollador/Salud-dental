export function destinoInterno(value: string | string[] | undefined, porDefecto = "/consultorio/pacientes") {
  const pedido = Array.isArray(value) ? value[0] : value;
  if (!pedido || !pedido.startsWith("/consultorio/") || pedido.startsWith("//") || pedido.includes("\\")) {
    return porDefecto;
  }
  return pedido;
}
