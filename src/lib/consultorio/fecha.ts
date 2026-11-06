const day = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && day.test(value);
}

export function todayInArgentina(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function fechaEnPalabras(iso: string) {
  if (!isIsoDate(iso)) return iso;
  const [year, month, dayOfMonth] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, dayOfMonth)));
}

export function edadEn(birthDate: string, today = todayInArgentina()) {
  if (!isIsoDate(birthDate) || !isIsoDate(today) || birthDate > today) return null;
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [year, month, dayOfMonth] = today.split("-").map(Number);
  const yaCumplio = month > birthMonth || (month === birthMonth && dayOfMonth >= birthDay);
  return year - birthYear - (yaCumplio ? 0 : 1);
}

export function edadEscrita(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d{1,3}$/.test(text)) return "";
  const age = Number(text);
  return age <= 130 ? String(age) : "";
}

export function fechaDeInicio(patient: {
  startedOn?: string;
  evolution: { date: string }[];
  updatedAt?: string;
}) {
  if (isIsoDate(patient.startedOn)) return patient.startedOn;
  const first = (patient.evolution ?? []).map((note) => note.date).filter(isIsoDate).sort()[0];
  if (first) return first;
  const updated = patient.updatedAt?.slice(0, 10) ?? "";
  if (isIsoDate(updated)) return updated;
  return todayInArgentina();
}
