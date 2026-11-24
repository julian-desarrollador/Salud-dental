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
  /** Versión del texto: queda guardada con cada firma hecha en el teléfono. */
  version: string;
  /** Se puede mandar por WhatsApp para firmar en el teléfono. */
  porWhatsapp?: boolean;
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
    version: "ortopedia-v1",
    porWhatsapp: true,
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
    version: "ortodoncia-v1",
    porWhatsapp: true,
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
];

/**
 * Hojas que ya no se ofrecen. Se conservan para mostrar las que algún paciente
 * ya firmó y subió en foto.
 */
export const retiredConsentSheets: ConsentSheet[] = [
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

/** Hoja propia que se puede mandar por WhatsApp (Ortodoncia, Ortopedia). */
export function hojaPropiaPorWhatsapp(kind: string): HojaPropia | undefined {
  const sheet = consentSheet(kind);
  return sheet && "sections" in sheet && sheet.porWhatsapp ? sheet : undefined;
}

/** Los tres consentimientos que Jesica usa: se mandan por WhatsApp y su texto se puede editar. */
export type HojaEditable = "general" | "ortodoncia" | "ortopedia";
export const HOJAS_EDITABLES: HojaEditable[] = ["general", "ortodoncia", "ortopedia"];
export const NOMBRE_HOJA: Record<HojaEditable, string> = {
  general: "Odontología general",
  ortodoncia: "Ortodoncia",
  ortopedia: "Ortopedia dentomaxilar",
};

export function esHojaEditable(kind: unknown): kind is HojaEditable {
  return HOJAS_EDITABLES.includes(kind as HojaEditable);
}

/** Hojas que se firman con un enlace en el teléfono del paciente. */
export function sePuedeEnviar(kind: string) {
  return esHojaEditable(kind);
}

/** El texto que lee y firma el paciente: un título y apartados (en el general, sin título). */
export type ApartadoTexto = { titulo: string; texto: string };
export type TextoConsentimiento = { titulo: string; apartados: ApartadoTexto[] };
export type TextoVigente = TextoConsentimiento & { version: string };

export const LIMITES_TEXTO = { titulo: 200, apartados: 20, tituloApartado: 120, texto: 3000 };

/** Los párrafos de un apartado: separados por una línea en blanco. */
export function parrafos(texto: string) {
  return texto
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);
}

/** El texto con el que viene cada hoja (la "v1"), antes de que Jesica lo edite. */
export function textoDeFabrica(kind: HojaEditable): TextoVigente {
  if (kind === "general") {
    return {
      version: GENERAL_CONSENT_VERSION,
      titulo: generalConsent.title,
      apartados: [{ titulo: "", texto: generalConsent.paragraphs.join("\n\n") }],
    };
  }
  const sheet = hojaPropiaPorWhatsapp(kind);
  if (!sheet) throw new Error("Hoja desconocida.");
  return {
    version: sheet.version,
    titulo: sheet.title,
    apartados: sheet.sections.map((section) => ({ titulo: section.title, texto: section.paragraphs.join("\n\n") })),
  };
}

/** Número de una versión ("ortodoncia-v3" → 3). */
export function numeroDeVersion(version: string) {
  const match = /-v(\d+)$/.exec(version);
  return match ? Number(match[1]) : 1;
}

function textoLimpio(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}

/** Texto editado por Jesica, recortado. Null si no queda ningún apartado con texto. */
export function sanitizeTexto(input: unknown): TextoConsentimiento | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { titulo?: unknown; apartados?: unknown };
  const titulo = textoLimpio(raw.titulo, LIMITES_TEXTO.titulo).replace(/\s+/g, " ");
  const apartados = (Array.isArray(raw.apartados) ? raw.apartados : [])
    .slice(0, LIMITES_TEXTO.apartados)
    .map((item) => {
      const apartado = (item && typeof item === "object" ? item : {}) as { titulo?: unknown; texto?: unknown };
      return {
        titulo: textoLimpio(apartado.titulo, LIMITES_TEXTO.tituloApartado).replace(/\s+/g, " "),
        texto: textoLimpio(apartado.texto, LIMITES_TEXTO.texto),
      };
    })
    .filter((apartado) => apartado.texto);
  if (!titulo || apartados.length === 0) return null;
  return { titulo, apartados };
}

export function mismoTexto(a: TextoConsentimiento, b: TextoConsentimiento) {
  return JSON.stringify({ t: a.titulo, a: a.apartados }) === JSON.stringify({ t: b.titulo, a: b.apartados });
}

export const MAX_NOTA = 500;

/** Lo que Jesica escribe en los espacios de la hoja antes de mandarla: solo etiquetas de la hoja, sin vacíos. */
export function sanitizeNotas(kind: string, input: unknown): { label: string; texto: string }[] {
  const sheet = hojaPropiaPorWhatsapp(kind);
  if (!sheet || !Array.isArray(input)) return [];
  const labels = new Set(sheet.blanks.map((blank) => blank.label));
  const vistas = new Set<string>();
  const notas: { label: string; texto: string }[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as { label?: unknown }).label ?? "");
    const texto = String((item as { texto?: unknown }).texto ?? "").replace(/\r\n?/g, "\n").trim().slice(0, MAX_NOTA);
    if (!labels.has(label) || vistas.has(label) || !texto) continue;
    vistas.add(label);
    notas.push({ label, texto });
  }
  return notas;
}
