import type { ConsentKind } from "./types";

export const GENERAL_CONSENT_VERSION = "general-v1";

export const generalConsent = {
  kind: "general" as const,
  version: GENERAL_CONSENT_VERSION,
  title: "Consentimiento informado",
  practice: "Consentimiento informado",
  paragraphs: [
    "Autorizo a la Dra. Goroso Jesica Brenda, a realizar el tratamiento informado en la presente.",
    "He conversado con el profesional sobre la naturaleza y propósito del tratamiento, sobre la posibilidad de complicaciones, los riesgos y posibles métodos alternativos.",
    "Autorizo a que se me realicen los servicios o tratamientos adicionales que considere razonables incluyendo la administración de anestesia local, prácticas radiológicas y otros tipos de métodos de diagnóstico.",
    "Sin más, me comprometo a cumplir con las indicaciones recomendadas por el profesional y asistir a los controles correspondientes.",
  ],
};

export type ConsentSheet = {
  kind: ConsentKind;
  title: string;
  practice: string;
  consists: string;
  risks: string[];
  alternatives: string;
};

export const consentSheets: ConsentSheet[] = [
  {
    kind: "implante",
    title: "Consentimiento informado · Implante dental",
    practice: "Colocación de un implante dental",
    consists:
      "Se coloca en el hueso un implante, en general de titanio, que reemplaza la raíz del diente perdido. Después de un tiempo de cicatrización se hace la corona o la prótesis que se apoya sobre ese implante. A veces hace falta un injerto o más de una cirugía. El diente definitivo no siempre se coloca el mismo día.",
    risks: [
      "Dolor, hinchazón y moretones los primeros días, que suelen ceder con los cuidados indicados.",
      "Sangrado o infección de la zona.",
      "Que el implante no se una al hueso y haya que retirarlo.",
      "Lesión de un diente vecino, del seno maxilar o de un nervio, con hormigueo o menor sensibilidad, a veces duradera.",
      "Necesidad de otra intervención o de cambiar el plan si el hueso no alcanza.",
    ],
    alternatives:
      "Según el caso: un puente sobre dientes vecinos, una prótesis removible, o no reponer el diente. Cada opción tiene otros cuidados y otros límites.",
  },
  {
    kind: "cirugia",
    title: "Consentimiento informado · Cirugía bucal",
    practice: "Cirugía bucal",
    consists:
      "Es una intervención en la boca: una extracción u otra cirugía que la profesional indica para este caso. Se hace con anestesia local. Después hay que cuidar la herida, la higiene y la alimentación como se explique en el consultorio.",
    risks: [
      "Dolor, hinchazón y dificultad para abrir la boca durante unos días.",
      "Sangrado, infección o alveolitis (inflamación del hueco de la extracción).",
      "Lesión de un diente vecino, de una restauración o de un nervio, con hormigueo o menor sensibilidad.",
      "En extracciones de arriba y atrás, comunicación con el seno maxilar.",
      "Que quede un resto de raíz o que haga falta otra intervención.",
    ],
    alternatives:
      "Cuando existen, se conversan antes: conservar la pieza con otro tratamiento, derivar, o postergar si el caso lo permite. No todas las cirugías tienen una alternativa equivalente.",
  },
  {
    kind: "endodoncia",
    title: "Consentimiento informado · Endodoncia",
    practice: "Tratamiento de conducto",
    consists:
      "Se trata el interior del diente, los conductos, cuando la pulpa está inflamada o infectada, o cuando el diente lo necesita para poder restaurarlo. El objetivo es conservar la pieza. Puede llevar más de una sesión. Después el diente queda más frágil y suele necesitar una restauración o una corona.",
    risks: [
      "Dolor o sensibilidad después de la sesión, en general transitorios.",
      "Que un conducto sea muy curvo, calcificado o inaccesible y el tratamiento no se pueda completar.",
      "Fractura del diente, de un instrumento, o una filtración que obligue a retratar o a una cirugía.",
      "Que, aun con el tratamiento, no se pueda conservar el diente.",
      "Reacción a la anestesia o a la medicación indicada.",
    ],
    alternatives:
      "Según el estado de la pieza: extraer el diente y, si corresponde, reponerlo después. Dejar el diente sin tratar suele mantener el dolor o la infección.",
  },
];

export function consentSheet(kind: string) {
  return consentSheets.find((sheet) => sheet.kind === kind);
}
