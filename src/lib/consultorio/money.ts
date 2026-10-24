export const collegeFeeDate = "1 de julio de 2026";

export const collegeHour = {
  withCosts: 71074,
  feesOnly: 35538,
};

export function pesos(value: number | null) {
  if (value == null) return "";
  return value.toLocaleString("es-AR");
}

export function parsePesos(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > 100_000_000) return null;
  return Math.round(number);
}
