/** URL canónica del sitio en producción (actualizar si cambia el dominio en Vercel) */
export const SITE_URL = 'https://salud-dental.vercel.app';

export type RouteSeo = {
  title: string;
  description: string;
};

export const routeSeo: Record<string, RouteSeo> = {
  '/': {
    title: 'Dra. Jesica Goroso | Odontóloga en Mar del Plata | Salud Dental',
    description:
      'Consultorio odontológico de la Dra. Jesica Goroso en Mar del Plata. Ortodoncia, ortopedia maxilar, estética dental, blanqueamiento y odontología para niños y adultos. Reservá tu turno.',
  },
  '/sobre-mi': {
    title: 'Sobre la Dra. Jesica | Odontóloga en Mar del Plata',
    description:
      'Conocé a la Dra. Jesica Brenda Goroso: más de 15 años de experiencia en ortodoncia, ortopedia maxilar y odontología estética en Mar del Plata.',
  },
  '/servicios': {
    title: 'Servicios odontológicos | Ortodoncia y estética dental | Mar del Plata',
    description:
      'Tratamientos de ortodoncia, alineadores invisibles, prótesis, carillas, blanqueamiento y odontología general. Consultorio Salud Dental, Mar del Plata.',
  },
  '/resultados': {
    title: 'Resultados y testimonios | Salud Dental Mar del Plata',
    description:
      'Antes y después y opiniones de pacientes de la Dra. Jesica Goroso. Ortodoncia y tratamientos odontológicos en Mar del Plata.',
  },
  '/contacto': {
    title: 'Contacto y ubicación | Salud Dental | Mar del Plata',
    description:
      'Contactá al consultorio Salud Dental: San Lorenzo 2908 (entre Hipólito Yrigoyen y La Rioja), Mar del Plata. Teléfono, WhatsApp y formulario de consulta.',
  },
  '/turnos': {
    title: 'Reservar turno odontológico | Dra. Jesica Goroso | Mar del Plata',
    description:
      'Pedí tu turno con la Dra. Jesica Goroso por WhatsApp. Consultorio odontológico en San Lorenzo 2908, Mar del Plata.',
  },
};

export const defaultSeo = routeSeo['/'];
