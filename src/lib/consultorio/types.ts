export const toothMarks = [
  { id: "sana", label: "Sana", short: "", color: "#f3f1eb" },
  { id: "caries", label: "Caries", short: "Caries", color: "#c47b6a" },
  { id: "ausente", label: "Ausente", short: "Ausente", color: "#d9d3c7" },
  { id: "restauracion", label: "Restauración", short: "Restaur.", color: "#a6b8a0" },
  { id: "endodoncia", label: "Endodoncia", short: "Endo", color: "#d4b482" },
  { id: "corona", label: "Corona", short: "Corona", color: "#3c544b" },
  { id: "implante", label: "Implante", short: "Implante", color: "#6d8794" },
] as const;

export type ToothMark = (typeof toothMarks)[number]["id"];

export const upperTeeth = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
] as const;

export const lowerTeeth = [
  "48", "47", "46", "45", "44", "43", "42", "41",
  "31", "32", "33", "34", "35", "36", "37", "38",
] as const;

export const allTeeth = [...upperTeeth, ...lowerTeeth];

export type ConsentKind = "general" | "implante" | "cirugia" | "endodoncia";

export type ConsentSource = "pantalla" | "papel";

export type Evolution = {
  id: string;
  date: string;
  text: string;
};

export type SignedConsent = {
  id: string;
  kind: ConsentKind;
  signedOn: string;
  signedAt?: string;
  aclaracion?: string;
  textVersion?: string;
  source?: ConsentSource;
  teethSnapshot?: Partial<Record<string, ToothMark>>;
  fileId?: string;
  fileName?: string;
  mime?: string;
};

export type ChartFile = {
  id: string;
  fileId: string;
  fileName: string;
  mime: string;
  addedOn: string;
};

export type Patient = {
  id: string;
  name: string;
  document: string;
  birthDate: string;
  contact: string;
  address: string;
  familyContact: string;
  background: string;
  reason: string;
  startedOn: string;
  evolution: Evolution[];
  teeth: Partial<Record<string, ToothMark>>;
  consents: SignedConsent[];
  files: ChartFile[];
  updatedAt: string;
};

export type FeeItem = {
  id: string;
  code: string;
  chapter: string;
  name: string;
  minimum: number | null;
  price: number | null;
  offered?: boolean;
};

export type Store = {
  patients: Patient[];
  fees: FeeItem[];
};
