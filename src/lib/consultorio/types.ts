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

/** "implante" y "cirugia" ya no se ofrecen, pero quedan para leer las hojas ya firmadas. */
export type ConsentKind = "general" | "ortopedia" | "ortodoncia" | "endodoncia" | "implante" | "cirugia";

export type ConsentSource = "pantalla" | "papel";

export type Firmante = "paciente" | "representante";

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
  piezasSnapshot?: Piezas;
  /** Firmas hechas en el teléfono de Ortodoncia/Ortopedia: quién firmó. */
  firmante?: Firmante;
  dniFirmante?: string;
  /** Lo que Jesica escribió en los espacios de la hoja (diagnóstico, observaciones) al mandarla. */
  notas?: { label: string; texto: string }[];
  /** Copia del texto que leyó el paciente al firmar en el teléfono (Jesica puede editarlo después). */
  texto?: { titulo: string; apartados: { titulo: string; texto: string }[] };
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

export type PrestacionCatalogo = {
  id: string;
  name: string;
  short: string;
};

export type EstadoPrestacion = "pendiente" | "realizada" | "";

export type PrestacionPieza = {
  id: string;
  prestacionId: string;
  name: string;
  short: string;
  estado: EstadoPrestacion;
  nota: string;
  addedOn: string;
  doneOn: string;
};

export type Piezas = Partial<Record<string, PrestacionPieza[]>>;

export type PasoPlan = {
  id: string;
  text: string;
  done: boolean;
  doneOn: string;
};

export type TipoPregunta = "sino" | "texto";

export type RespuestaSiNo = "si" | "no";

export type PreguntaMedica = {
  id: string;
  text: string;
  kind: TipoPregunta;
  showWhen?: RespuestaSiNo;
  children: PreguntaMedica[];
};

export type RespuestaMedica = {
  question: string;
  kind: TipoPregunta;
  value: string;
  answeredOn: string;
};

export type RespuestasMedicas = Record<string, RespuestaMedica>;

export type Patient = {
  id: string;
  name: string;
  document: string;
  birthDate: string;
  age: string;
  ageSetOn: string;
  contact: string;
  address: string;
  familyContact: string;
  background: string;
  medicalAnswers: RespuestasMedicas;
  reason: string;
  startedOn: string;
  evolution: Evolution[];
  piezas: Piezas;
  plan: PasoPlan[];
  presupuestos: Presupuesto[];
  /** Formato viejo, una marca por diente. Solo se lee para convertirlo a `piezas`. */
  teeth?: Partial<Record<string, ToothMark>>;
  consents: SignedConsent[];
  files: ChartFile[];
  updatedAt: string;
};

/** Una fila de la lista de precios de Jesica. `chapter` es el tipo. */
export type FeeItem = {
  id: string;
  chapter: string;
  name: string;
  price: number | null;
};

export type ItemPresupuesto = {
  id: string;
  tipo: string;
  name: string;
  cantidad: number;
  precio: number | null;
};

export type Presupuesto = {
  id: string;
  titulo: string;
  createdOn: string;
  items: ItemPresupuesto[];
  nota: string;
  sentOn: string;
};

export type Store = {
  patients: Patient[];
  fees: FeeItem[];
};
