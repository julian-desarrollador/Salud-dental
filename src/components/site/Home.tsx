'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { trackReservarTurno, trackWhatsApp } from '../../lib/analytics'
import Slider from 'react-slick'
import type { CustomArrowProps } from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import '../../styles/slick.css'

const logoSrc = '/logo%20salud%20dental%20verde.png'


const featuredServices = [
  {
    title: 'Ortodoncia para adolescentes y adultos con brackets.',
    description:
      'Tratamiento de Ortodoncia fija con brackets de diferentes materiales, pudiendo el paciente, optar por la aparatología deseada.\nDesde las técnicas más sencillas hasta las de alta tecnología, estética y confort. Logrando resultados exitosos, corrigiendo la oclusión, tratando cuidadosamente la salud de la articulación temporomandibular, tejidos periodontales y dentarios, dando como resultado la sonrisa ideal.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/ba4523e334bf8dbde9a91b611418fa3e_oqnvil.webp',
    features: [],
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/ba4523e334bf8dbde9a91b611418fa3e_oqnvil.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950781/a0a2615eac7c8169a8f9ef0ff462a6ca_nxw0qg.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950773/a0f5f93fd15c54a3b909854aaa7fb142_wmxy8w.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/3f2259fed0e3e91262ca1656dc7dac44_ofggdo.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/eab7004dd258070f24a899b479432856_jvmg5m.webp'
    ]
  },
  {
    title: 'Ortodoncia para adolescentes y adultos  con brackets autoligables.',
    description:
      'Última tecnología en Brackets, con características beneficiosas para el tratamiento del paciente.\nÉsta técnica con Brackets autoligables se caracteriza por:',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/ba76e8a5085a690329c98ac430c822c1_rxzqu0.webp',
    features: [
      'Ser indolora.',
      'Tratamiento más rápidos que las técnicas convencionales.',
      'Evitar extracciones dentales en los tratamientos indicados con ellas.',
      'Mejor confort.',
      'Mejor higiene.',
      'Sonrisas amplias.'
    ],
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/ba76e8a5085a690329c98ac430c822c1_rxzqu0.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/977eea7e0fb3319c1620b901c3c33b9b_r7ilwb.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950773/39de3a252d50fbccaad0e173577afd8a_rouq6v.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/228a01e11e5583f86cbe4091e4f3865d_vokpmv.webp'
    ]
  },
  {
    title: 'Alineadores Invisibles para adultos.',
    description:
      'Tratamientos de alineación dentaria de última generación. Con materiales confeccionados con tecnología de avanzada, donde el paciente goza de un buen confort y alta estética.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/clearadultbraces3_riign8.webp',
    features: []
  },
  {
    title: 'Ortopedia para niños.',
    description:
      'Aparatología Removible. Aplicada en pacientes de los 5 a 10 años aprox.\nTratamientos destinados a la corrección de los maxilares en edades tempranas del desarrollo (en pacientes con dientes de leche o temporarios), donde la aparatología utilizada no provoca dolor ni malestar al paciente pequeño.\nCon éstos tratamientos, obtenemos como resultado,',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/c4e0bd6b5b5317cca813ac74697949ff_p2phab.webp',
    features: [
      'Aumentar el tamaño de los maxilares, evitando futuro apiñamiento dentario.',
      'La corrección de una  maloclusión.',
      'Corregir un mal hábito.',
      'Corrección de una deglución atípica.',
      'Corrigen un apoyo lingual incorrecto.',
      'Entre otras …'
    ],
    afterFeatures: 'Son tratamientos interdisciplinarios, dónde el papel del fonoaudiólogo y/o Otorrinolaringólogo, puede ser importante para el éxito total del tratamiento.',
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/c4e0bd6b5b5317cca813ac74697949ff_p2phab.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/2a4673a6470c113caabdcce3196f7c61_r8j1p2.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/dc521f5d28f76217cad6be5120cc238a_t2soi8.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950781/41f4259a4da690d3115003886aae15f4_z0nnue.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/44bb99162184c65bf764f811251b8a3a_ann2ff.webp'
    ]
  },
  {
    title: 'Prótesis Dental Fija',
    description:
      'Tratamiento de reemplazo fijo de piezas faltantes, sin necesidad de retirar para su higiene, no invasivo, sin cirugía, de alta durabilidad, excelente comodidad y estética.\nDichos tratamientos pueden utilizarse para:',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/29a58e0956d26bc06aada50db49814d9_wtni4o.webp',
    features: [
      'Reemplazo de una o varias  piezas dentales faltantes.',
      'Modificar el tamaño de un diente.',
      'Modificar la forma dentaria.',
      'Solucionar el color de una pieza dentaria afectada.'
    ],
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/29a58e0956d26bc06aada50db49814d9_wtni4o.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/de56ea4a2b2b1fe8986b84980b988866_mgemyc.webp'
    ]
  },
  {
    title: 'Carillas Dentales',
    description:
      'Son tratamientos estéticos, en la cual reemplazamos una capa de tejido superficial del diente por material de alta estética, confeccionado especialmente para el caso en cuestión, pudiendo otorgar el color y/o forma deseada.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950770/417e3cba7a94a97c4692c8acc82a00a9_rydcoo.webp',
    features: [],
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950770/417e3cba7a94a97c4692c8acc82a00a9_rydcoo.webp',
      '/carillas.jpeg'
    ]
  },
  {
    title: 'Blanqueamiento Dental',
    description:
      'Se utilizan variedad de técnicas de Blanqueamiento dental, dependiendo la necesidad o requerimiento del paciente. Son técnicas muy poco invasivas, lo que mantiene la integridad dental natural.\n Sus materiales son exclusivos, de uso y manipulación profesional lo que hace de un tratamiento seguro y sin complicaciones.\nEl paciente obtiene una sonrisa naturalmente estética, con piezas dentales  blancas, limpias y saludables.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950770/blanqueamiento-dental-raga-ortodoncia_uzliyf.webp',
    features: []
  },
  {
    title: 'Prótesis Dentales  Removibles',
    description:
      'Son aparatos de reemplazo dental parciales o totales. pueden estar confeccionados con diversos materiales y diseños apropiados a cada caso. Los cuales fueron evolucionando con el tiempo, pudiendo ofrecer al paciente estética y confort a la hora de su rehabilitación con prótesis removibles.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950773/9a2c6acc3b9645096e78190ec8999c77_letalg.webp',
    features: [],
    photos: [
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950773/9a2c6acc3b9645096e78190ec8999c77_letalg.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950770/a9bfd2401e22a377c5484979bcea26fe_yiyeta.webp',
      'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950772/c91ec351427127a512e676de900fc50c_vzfnko.webp'
    ]
  },
  {
    title: 'Medicina Estética',
    description:
      'Es la rama de la medicina donde el Odontólogo Especializado, aborda los tejidos superficiales y/o músculos faciales, a través de inyecciones  de sustancias apropiadas para la soluciones estéticas, las cuales pueden ser ácido hialurónico y toxina Botulínica.\nLos tratamientos más solicitados al odontólogo, luego de una rehabilitación oral adecuada ya sea con ortodoncia o prótesis dental, son la solución de una sonrisa gingival, tratamiento de bruxismo o terminación estética para un labio con dimensiones armoniosas.',
    icon: '🦷',
    image: '/odontologia.png',
    features: []
  },
  {
    title: 'Odontología general para niños, adolescentes y  adultos.',
    description:
      'Tratamos la salud bucal del paciente diagnosticando y tratando de forma cuidadosa y responsable las posibles enfermedades bucales que afectan la salud general.\nLe damos fundamental importancia a la  prevención, educando e informando a los pacientes de los cuidados necesarios y los cambios que sufrimos con las distintas etapas evolutivas de la vida, manteniendo la salud bucal de la familia en condiciones óptimas.',
    icon: '🦷',
    image: 'https://res.cloudinary.com/dzoupwn0e/image/upload/v1754950771/importancia-de-la-salud-dental_ff4weo.webp',
    features: []
  }
]

const testimonials = [
  {
    name: 'Luz Mónaco',
    text: 'Genia Jesi, siempre muy atenta, profesional y con la mejor energía para atender a sus pacientes pequeños sobretodo!!! 😍',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjUY5mXIB9uGRQCdQEz85A_wpZd5BKYPastULyuCp1dsOkLuepz1=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Sonia',
    text: 'Excelente atención! Jesi una genia! Atiende con mucha paciencia y amor',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjUJCLAKxCINHAwvz-AI1FnYaOeLbsJd1BJccINCH9IlwhG5Dd4=w72-h72-p-rp-mo-ba3-br100'
  },
  {
    name: 'Oscar Farias',
    text: 'Una genia Jesica hace años nos atiende a todo el grupo familiar para los controles y ahora con tratamiento de ortodoncia junto con mis nenas..los niños se sienten super cómodos 100% recomendable.',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLvhPmZGBr7mVdgBVqnJRLoz_y7uc3d7hDx4HK4UqD5TZQZsA=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Martina',
    text: 'Una genia Jesi 🙌🏻 Excelente atención siempre, la súper recomiendo.…',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjVpLdkl5ayGQAR4Tbmt6vn3jGnUkWtulw4AP38g3Mb12OCHfRkG2A=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Kevin Miguel',
    text: 'El mejor lugar, con una profesional increíble.',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjV7EdDuGGqRAPYERT4MEhYqxUEp-oxkZwCM4V3kwaCHIJDbpis4mg=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Nicole Balinotti',
    text: 'Excelente atención y es super amorosa .\nSuper recomendable.',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJX4tMHZMZ4Pgtv8XZufxuRrjsbocuUWs58ji3Drjg_9Q0IAg=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Carla Mariela Beraghi',
    text: 'Excelente profesional!, recomiendo 100%',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjVEfKi10bDVpATYiTTCXa7R8B37cJuSooS4l3rsIdnX933smuy_=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Juan Pablo Becher',
    text: 'Excelente atención, muy profesional, impecable desde el punto de vista sanitario, muy recomendable!',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIT41yk-uHKIt4tmo9d5RUScsZhAzhoBriaDt65FDriLFyA-g=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Iara nakandakari',
    text: 'Recomendable 100%!!!! Es super profesional y amable.',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjWFZmLIDReRv58RGT7T2FPH1IXHdacfTjf1qyEyd1e_fgP9tysl=w72-h72-p-rp-mo-ba3-br100'
  },
  {
    name: 'Héctor emanuele',
    text: 'Excelente servicio',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLThD0SVUMPEX4KkmyHdfB1F3ydAjEpMeA-ciQ5N9Pc7oWF4WIm=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Fatima Rodriguez',
    text: '',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKN81y9Ts5B8Mnt--51C8e_gNzAwWh4GEcTbvN5pyu5eyjWNg=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Verónica Inés Iturbide',
    text: '',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjXBXbxEqDQ89j77IxDCMFxK9Dw2jfdZD4EvhNIVhOUzCpXtsK8YJQ=w72-h72-p-rp-mo-ba3-br100'
  },
  {
    name: 'Lorena Arias',
    text: '',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjW3EnWhLaV6eD3b8kNcndhDoOegYCDBGP61LNwz4wWQu2gwTfP9ww=w72-h72-p-rp-mo-br100'
  },
  {
    name: 'Hector Adrian Antunez',
    text: '',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjU-vplvAk_zvdKxY6MZ0rA90qpMabxK0QS6LKyvJ3gENhzJVZPB3w=w72-h72-p-rp-mo-ba5-br100'
  },
  {
    name: 'Fedra Sigampa',
    text: '',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjWumPsx8v49f5ex92zJF-Y3fZGiIxQolMzCawn4L_WeZDNztuPDtw=w72-h72-p-rp-mo-ba2-br100'
  }
]

const Home = () => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [activeImages, setActiveImages] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const sliderRef = useRef<Slider | null>(null)
  const testimonialsSliderRef = useRef<Slider | null>(null)

  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url)

  const PrevArrow = ({ onClick }: CustomArrowProps) => (
    <button
      aria-label="Anterior"
      onClick={onClick}
      className="carousel-arrow hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 md:-translate-y-[60%] z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 border border-gray-200 cursor-pointer"
    >
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
  )

  const NextArrow = ({ onClick }: CustomArrowProps) => (
    <button
      aria-label="Siguiente"
      onClick={onClick}
      className="carousel-arrow hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 md:-translate-y-[60%] z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 border border-gray-200 cursor-pointer"
    >
      <svg className="w-6 h-6 text-gray-600 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>
  )

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowLeft') sliderRef.current?.slickPrev()
      if (e.key === 'ArrowRight') sliderRef.current?.slickNext()
    }
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen])

  const openLightbox = (images: string[], startIndex = 0) => {
    setActiveImages(images)
    setActiveIndex(startIndex)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => setIsLightboxOpen(false)

  return (
    <div className="pt-16 shadow-md">
      {/* Hero Section */}
      <section className="relative bg-white min-h-[90vh] flex items-center justify-center text-center px-6 sm:px-12 lg:px-24 pt-6 sm:pt-8">
  <div className="max-w-xl z-10">
    {/* <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-gray-900 leading-tight">
      Salud Dental
    </h1> */}
    <img src={logoSrc} alt="Salud Dental - Dra. Jesica Goroso, odontóloga en Mar del Plata" className="block mx-auto w-[21rem] sm:w-96 md:w-[28rem] lg:w-[36rem] h-auto" />
    <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
      Consultorio Odontológico Especializado con atención profesional para toda la familia.
    </p>
    <div className="mt-10 flex items-center justify-center">
      <Link
        href="/turnos"
        onClick={() => trackReservarTurno('hero_reservar_turno')}
        className="inline-block text-md rounded-full border border-primary bg-[rgb(44,123,183)] px-6 py-3 font-bold tracking-tight text-white hover:bg-[rgb(44,123,183)]/90 transition"
      >
        Reservar turno
      </Link>
    </div>
  </div>
</section>


      {/* Featured Services */}
      <section className="pt-10 pb-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Especialidades</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Contamos con profesionales que ofrecen tratamientos con la tecnología apropiada, alta formación académica y experiencia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-4xl">{service.icon}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 flex-none shrink-0 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {service.afterFeatures && (
                    <p className="text-gray-600 mt-3">{service.afterFeatures}</p>
                  )}
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/contacto?from=consultar"
                      className="inline-flex items-center rounded-full bg-[rgb(44,123,183)] px-4 py-2 text-white font-semibold hover:bg-[rgb(44,123,183)]/90 transition-colors"
                    >
                      Consultar
                    </Link>
                    {service.photos && service.photos.length > 0 && (
                      <button
                        onClick={() => openLightbox(service.photos!, 0)}
                        className="inline-flex items-center rounded-full border border-primary text-primary px-4 py-2 font-semibold hover:bg-primary/5 transition-colors"
                      >
                        Ver fotos
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeLightbox}
          />

          {/* Botón cerrar */}
          <button
            aria-label="Cerrar"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-[60] inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
          >
            ×
          </button>

          {/* Controles izquierda/derecha */}
          <button
            aria-label="Anterior"
            onClick={() => sliderRef.current?.slickPrev()}
            className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 left-3 md:left-6 z-[60] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8"><path fillRule="evenodd" d="M15.78 3.72a.75.75 0 010 1.06L9.56 11l6.22 6.22a.75.75 0 11-1.06 1.06l-6.75-6.75a.75.75 0 010-1.06l6.75-6.75a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => sliderRef.current?.slickNext()}
            className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 right-3 md:right-6 z-[60] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8"><path fillRule="evenodd" d="M8.22 20.28a.75.75 0 010-1.06L14.44 13 8.22 6.78a.75.75 0 011.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 01-1.06 0z" clipRule="evenodd" /></svg>
          </button>

          {/* Contenedor del slide */}
          <div className="relative z-[55] w-full max-w-6xl px-4 lightbox-slider">
            <Slider
              ref={sliderRef}
              initialSlide={activeIndex}
              dots={true}
              infinite={true}
              speed={400}
              slidesToShow={1}
              slidesToScroll={1}
              swipe={true}
              arrows={false}
              adaptiveHeight={true}
              beforeChange={(_, next) => setActiveIndex(next)}
            >
              {activeImages.map((src, idx) => (
                <div key={idx} className="px-2">
                  {isVideoUrl(src) ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="mx-auto max-h-[80vh] md:max-h-[85vh] w-auto object-contain drop-shadow-2xl rounded-[5%] bg-black"
                    >
                      <source src={src} />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  ) : (
                    <img
                      src={src}
                      alt={`foto-${idx + 1}`}
                      className="mx-auto max-h-[80vh] md:max-h-[85vh] w-auto object-contain drop-shadow-2xl rounded-[5%]"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </Slider>

            {/* Controles inferiores (solo móvil) */}
            <div className="md:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-[70] flex items-center justify-center gap-4">
              <button
                aria-label="Anterior"
                onClick={() => sliderRef.current?.slickPrev()}
                className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M15.78 3.72a.75.75 0 010 1.06L9.56 11l6.22 6.22a.75.75 0 11-1.06 1.06l-6.75-6.75a.75.75 0 010-1.06l6.75-6.75a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
              </button>
              <button
                aria-label="Siguiente"
                onClick={() => sliderRef.current?.slickNext()}
                className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M8.22 20.28a.75.75 0 010-1.06L14.44 13 8.22 6.78a.75.75 0 011.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 01-1.06 0z" clipRule="evenodd" /></svg>
              </button>
            </div>

            {/* Indicador (oculto en móvil) */}
            <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/30 px-3 py-1 rounded-full">
              {activeIndex + 1} / {activeImages.length}
            </div>
          </div>
        </div>
      )}

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Lo que dicen nuestros pacientes</h2>
          <div className="relative max-w-4xl mx-auto testimonials-slider">
            <Slider ref={testimonialsSliderRef} {...sliderSettings}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="px-4">
                  <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{testimonial.name}</h3>
                        <div className="flex items-center">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <span key={i} className="text-yellow-400 text-2xl">★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {testimonial.text?.trim() && (
                      <p className="text-gray-600 text-lg leading-relaxed italic">"{testimonial.text}"</p>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
            {/* Controles inferiores (solo móvil) para testimonios con nuevo diseño */}
            <div className="md:hidden mt-1 flex items-center justify-center gap-4">
              <button
                aria-label="Anterior"
                onClick={() => testimonialsSliderRef.current?.slickPrev()}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200 cursor-pointer"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button
                aria-label="Siguiente"
                onClick={() => testimonialsSliderRef.current?.slickNext()}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200 cursor-pointer"
              >
                <svg className="w-6 h-6 text-gray-600 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">¿Listo para mejorar tu sonrisa?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Escribinos hoy mismo y da el primer paso hacia la mejor sonrisa !
          </p>
          <a
            href="https://wa.me/5492236160437?text=Hola! Quiero consultar por un turno en Salud Dental."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp('home_cta_whatsapp')}
            className="inline-flex items-center gap-2 text-lg bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            2236160437
          </a>
        </div>
      </section>
    </div>
  )
}

export default Home 