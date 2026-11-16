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

/** Dato que la hoja puede traer completo desde la ficha. */
export type DatoDeLaHoja = "dni" | "nacimiento" | "profesional";

type HojaComun = {
  kind: ConsentKind;
  title: string;
  practice: string;
  /** La firma puede ser de la madre, el padre o un tutor. */
  minor?: boolean;
  /** Texto provisorio hasta que llegue el de Jesica. Se marca en pantalla y al imprimir. */
  draft?: boolean;
};

/** Hoja breve, armada por nosotros: en qué consiste, qué puede pasar y otras posibilidades. */
export type HojaBreve = HojaComun & {
  consists: string;
  risks: string[];
  alternatives: string;
  /** Párrafo final de compromiso. Si falta, se usa el general. */
  commitment?: string;
};

/** Hoja con el texto de Jesica, tal cual lo escribió. */
export type HojaPropia = HojaComun & {
  /** Renglones a completar debajo de "Paciente". */
  fields: { label: string; dato?: DatoDeLaHoja }[];
  /** Apartados numerados, con su título y sus párrafos. */
  sections: { title: string; paragraphs: string[] }[];
  /** Espacios libres para escribir a mano. */
  blanks: { label: string; lines: number }[];
  /** Firmas agrupadas: cada grupo queda junto al imprimir. */
  signatures: string[][];
};

export type ConsentSheet = HojaBreve | HojaPropia;

export const defaultCommitment =
  "Me comprometo a avisar si aparece dolor fuerte, sangrado, fiebre o hinchazón que no cede, y a seguir las indicaciones de cuidado. Puedo retirar mi consentimiento antes de que se realice la práctica.";

/** Hojas que se ofrecen para imprimir y subir. */
export const consentSheets: ConsentSheet[] = [
  {
    kind: "ortopedia",
    title: "Consentimiento informado para tratamiento de ortopedia dentomaxilar",
    practice: "Ortopedia dentomaxilar",
    minor: true,
    fields: [
      { label: "DNI", dato: "dni" },
      { label: "Fecha de nacimiento", dato: "nacimiento" },
      { label: "Padre, madre o representante legal" },
      { label: "DNI del representante" },
      { label: "Profesional tratante", dato: "profesional" },
      { label: "Matrícula profesional" },
    ],
    sections: [
      {
        title: "Descripción y objetivos del tratamiento",
        paragraphs: [
          "Se me ha informado que la ortopedia dentomaxilar es un tratamiento destinado a prevenir, interceptar o corregir determinadas alteraciones del crecimiento y desarrollo de los maxilares, de la relación entre ambas arcadas y de las funciones orofaciales. Según el diagnóstico, podrá indicarse el uso de aparatos removibles, fijos o funcionales, con el objetivo de mejorar las relaciones dentoesqueléticas y favorecer un desarrollo más adecuado.",
        ],
      },
      {
        title: "Duración y respuesta al tratamiento",
        paragraphs: [
          "Comprendo que el resultado depende de la edad, el crecimiento y desarrollo del paciente, la alteración presente, la respuesta biológica y la colaboración. La duración es estimativa y puede requerir modificaciones del plan, controles periódicos o una segunda etapa de tratamiento ortodóncico.",
        ],
      },
      {
        title: "Riesgos y posibles complicaciones",
        paragraphs: [
          "He sido informado/a de que pueden presentarse molestias, presión o dolor transitorio, irritación de mucosas, aumento de salivación, dificultades iniciales para hablar o masticar, lesiones por roce, rotura o pérdida del aparato, movimientos dentarios no deseados y alteraciones en la erupción dentaria. Según el tipo de aparato y el caso, pueden presentarse cambios oclusales no previstos, reabsorción radicular, problemas gingivales o resultados insuficientes.",
        ],
      },
      {
        title: "Uso del aparato y colaboración familiar",
        paragraphs: [
          "Me comprometo, como paciente o representante legal, a cumplir las indicaciones de uso, higiene, limpieza y conservación del aparato, asistir a los controles y comunicar cualquier rotura, molestia persistente o dificultad. Comprendo que el uso irregular puede reducir la eficacia del tratamiento y prolongar su duración.",
        ],
      },
      {
        title: "Limitaciones y alternativas",
        paragraphs: [
          "Comprendo que el tratamiento puede mejorar determinadas alteraciones, pero no garantiza una corrección completa ni elimina la posibilidad de necesitar ortodoncia posterior u otros procedimientos. Se me han explicado las alternativas aplicables al caso, la posibilidad de controlar el crecimiento sin intervenir de inmediato y las consecuencias previsibles de no realizar el tratamiento indicado.",
        ],
      },
      {
        title: "Seguimiento",
        paragraphs: [
          "Acepto la necesidad de controles periódicos para evaluar la evolución del crecimiento, la respuesta al tratamiento y la necesidad de mantener, modificar o finalizar el uso del aparato.",
        ],
      },
      {
        title: "Consentimiento",
        paragraphs: [
          "Declaro haber recibido información clara sobre el diagnóstico, los objetivos, los beneficios esperados, los riesgos, las alternativas y las limitaciones del tratamiento. He podido formular preguntas y recibir respuestas satisfactorias.",
          "En mi carácter de paciente o representante legal, autorizo la realización del tratamiento de ortopedia dentomaxilar propuesto, de acuerdo con el plan individual explicado por el profesional.",
        ],
      },
    ],
    blanks: [
      { label: "Diagnóstico y aparato indicado", lines: 2 },
      { label: "Observaciones", lines: 1 },
    ],
    signatures: [
      ["Lugar y fecha"],
      ["Firma del paciente (si corresponde)"],
      ["Firma del padre, madre o representante legal", "Aclaración y DNI"],
      ["Firma y sello del profesional"],
    ],
  },
  {
    kind: "ortodoncia",
    title: "Consentimiento informado para tratamiento de ortodoncia",
    practice: "Ortodoncia",
    minor: true,
    fields: [
      { label: "DNI", dato: "dni" },
      { label: "Fecha de nacimiento", dato: "nacimiento" },
      { label: "Profesional tratante", dato: "profesional" },
      { label: "Matrícula profesional" },
    ],
    sections: [
      {
        title: "Descripción y objetivos del tratamiento",
        paragraphs: [
          "Se me ha informado que el tratamiento de ortodoncia tiene como finalidad corregir la posición de las piezas dentarias y mejorar la oclusión, la función masticatoria y la estética dentofacial. Para ello podrán utilizarse aparatos fijos, removibles o alineadores, según el diagnóstico y el plan de tratamiento individual.",
        ],
      },
      {
        title: "Duración y controles",
        paragraphs: [
          "Comprendo que la duración del tratamiento es estimativa y puede variar según la complejidad del caso, el crecimiento, la respuesta biológica y mi colaboración. Me comprometo a asistir a los controles indicados y cumplir las instrucciones profesionales.",
        ],
      },
      {
        title: "Riesgos y posibles complicaciones",
        paragraphs: [
          "He sido informado/a de que pueden presentarse molestias, dolor o sensibilidad, irritación de labios y mejillas, lesiones de tejidos blandos, descalcificaciones o manchas blancas, caries, inflamación gingival, enfermedad periodontal, reabsorción radicular, alteraciones pulpares y, excepcionalmente, pérdida dentaria. También pueden producirse movimientos dentarios no deseados, recidivas o resultados diferentes de los esperados.",
        ],
      },
      {
        title: "Higiene y colaboración",
        paragraphs: [
          "Me comprometo a mantener una adecuada higiene bucal, utilizar los elementos indicados, respetar las pautas alimentarias y cuidar los aparatos. Comprendo que la falta de colaboración puede prolongar el tratamiento, perjudicar los resultados o motivar su modificación.",
        ],
      },
      {
        title: "Alternativas y consecuencias de no tratar",
        paragraphs: [
          "Se me han explicado las alternativas aplicables a mi caso, sus beneficios y limitaciones, así como las posibles consecuencias de no realizar el tratamiento, entre ellas la persistencia o el agravamiento de determinadas alteraciones oclusales.",
        ],
      },
      {
        title: "Finalización y contención",
        paragraphs: [
          "Comprendo que, al finalizar el tratamiento activo, puede ser necesario utilizar aparatos de contención durante un período prolongado o indefinido para disminuir el riesgo de recidiva. La estabilidad de los resultados no puede garantizarse de manera absoluta.",
        ],
      },
      {
        title: "Consentimiento",
        paragraphs: [
          "Declaro haber recibido información clara sobre mi diagnóstico, el tratamiento propuesto, sus beneficios, riesgos, alternativas y limitaciones. He tenido la oportunidad de formular preguntas y recibir respuestas satisfactorias. Comprendo que puedo retirar mi consentimiento, dejando constancia de ello en la historia clínica.",
          "Por lo expuesto, otorgo mi consentimiento para realizar el tratamiento de ortodoncia propuesto.",
        ],
      },
    ],
    blanks: [{ label: "Observaciones o particularidades del caso", lines: 2 }],
    signatures: [
      ["Lugar y fecha"],
      ["Firma del paciente", "Aclaración y DNI"],
      ["Firma del padre, madre o representante legal (si corresponde)", "Aclaración y DNI"],
      ["Firma y sello del profesional"],
    ],
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

/**
 * Hojas que ya no se ofrecen. Se conservan para mostrar las que algún paciente
 * ya firmó y subió en foto.
 */
export const retiredConsentSheets: ConsentSheet[] = [
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
];

export function consentSheet(kind: string) {
  return consentSheets.find((sheet) => sheet.kind === kind);
}

export function practiceOf(kind: string) {
  return [...consentSheets, ...retiredConsentSheets].find((sheet) => sheet.kind === kind)?.practice ?? kind;
}
