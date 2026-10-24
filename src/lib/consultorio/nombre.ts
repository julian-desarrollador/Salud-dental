export function claveNombre(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function digitosTelefono(value: string) {
  return value.replace(/\D/g, "");
}
