'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Link from 'next/link'
import { trackReservarTurno } from '../../lib/analytics';

interface BeforeAfter {
  id: number;
  title: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  treatment: string;
  duration: string;
}

interface Testimonial {
  id: number;
  name: string;
  image: string;
  text: string;
  rating: number;
  treatment: string;
}

const beforeAfterCases: BeforeAfter[] = [
  {
    id: 1,
    title: "Blanqueamiento Dental Profesional",
    beforeImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764498/2despues_wtw6js.webp",
    afterImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764499/2antes_h1daxr.webp",
    description: "Resultados inmediatos con nuestro sistema de blanqueamiento láser",
    treatment: "Blanqueamiento Dental con Láser",
    duration: "1 sesión"
  },
  {
    id: 2,
    title: "Corrección Dental con Ortodoncia",
    beforeImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764616/3despues_zznxs4.webp",
    afterImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764616/5antes_yk7hbg.webp",
    description: "Transformá tu sonrisa con nuestro tratamiento de ortodoncia profesional. Ideal para alinear dientes torcidos y mejorar la mordida.",
    treatment: "Ortodoncia con Brackets Metálicos",
    duration: "12 a 24 meses"
  },
  {
    id: 3,
    title: "Rehabilitación Oral con Prótesis Dentales",
    beforeImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764732/6despues_2_wxuldc.webp",
    afterImage: "https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749764732/6antes_pupuzw.webp",
    description: "Devolvé la funcionalidad y la estética a tu sonrisa con nuestras prótesis dentales personalizadas, ideales para pacientes sin piezas dentales.",
    treatment: "Prótesis Dentales Totales Removibles",
    duration: "2 a 4 semanas (según el caso)"
  }
];

const testimonials: Testimonial[] = [
  {
    id: 7,
    name: 'Carla Mariela Beraghi',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjVEfKi10bDVpATYiTTCXa7R8B37cJuSooS4l3rsIdnX933smuy_=w72-h72-p-rp-mo-br100',
    text: 'Excelente profesional!, recomiendo 100%',
    rating: 5,
    treatment: ''
  },
  {
    id: 8,
    name: 'Juan Pablo Becher',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocIT41yk-uHKIt4tmo9d5RUScsZhAzhoBriaDt65FDriLFyA-g=w72-h72-p-rp-mo-br100',
    text: 'Excelente atención, muy profesional, impecable desde el punto de vista sanitario, muy recomendable!',
    rating: 5,
    treatment: ''
  },
  {
    id: 6,
    name: 'Martina',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjVpLdkl5ayGQAR4Tbmt6vn3jGnUkWtulw4AP38g3Mb12OCHfRkG2A=w72-h72-p-rp-mo-br100',
    text: 'Una genia Jesi 🙌🏻 Excelente atención siempre, la súper recomiendo.…',
    rating: 5,
    treatment: ''
  },
  {
    id: 3,
    name: 'Luz Mónaco',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjUY5mXIB9uGRQCdQEz85A_wpZd5BKYPastULyuCp1dsOkLuepz1=w72-h72-p-rp-mo-br100',
    text: 'Genia Jesi, siempre muy atenta, profesional y con la mejor energía para atender a sus pacientes pequeños sobretodo!!! 😍',
    rating: 5,
    treatment: ''
  },
  {
    id: 9,
    name: 'Iara nakandakari',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjWFZmLIDReRv58RGT7T2FPH1IXHdacfTjf1qyEyd1e_fgP9tysl=w72-h72-p-rp-mo-ba3-br100',
    text: 'Recomendable 100%!!!! Es super profesional y amable.',
    rating: 5,
    treatment: ''
  },
  {
    id: 2,
    name: 'Sonia',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjUJCLAKxCINHAwvz-AI1FnYaOeLbsJd1BJccINCH9IlwhG5Dd4=w72-h72-p-rp-mo-ba3-br100',
    text: 'Excelente atención! Jesi una genia! Atiende con mucha paciencia y amor',
    rating: 5,
    treatment: ''
  },
  {
    id: 4,
    name: 'Oscar Farias',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocLvhPmZGBr7mVdgBVqnJRLoz_y7uc3d7hDx4HK4UqD5TZQZsA=w72-h72-p-rp-mo-br100',
    text: 'Una genia Jesica hace años nos atiende a todo el grupo familiar para los controles y ahora con tratamiento de ortodoncia junto con mis nenas..los niños se sienten super cómodos 100% recomendable.',
    rating: 5,
    treatment: ''
  },
  {
    id: 1,
    name: 'Kevin Miguel',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjV7EdDuGGqRAPYERT4MEhYqxUEp-oxkZwCM4V3kwaCHIJDbpis4mg=w72-h72-p-rp-mo-br100',
    text: 'El mejor lugar, con una profesional increíble.',
    rating: 5,
    treatment: ''
  },
  {
    id: 5,
    name: 'Nicole Balinotti',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocJX4tMHZMZ4Pgtv8XZufxuRrjsbocuUWs58ji3Drjg_9Q0IAg=w72-h72-p-rp-mo-br100',
    text: 'Excelente atención y es super amorosa .\nSuper recomendable.',
    rating: 5,
    treatment: ''
  },
  {
    id: 10,
    name: 'Héctor emanuele',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocLThD0SVUMPEX4KkmyHdfB1F3ydAjEpMeA-ciQ5N9Pc7oWF4WIm=w72-h72-p-rp-mo-br100',
    text: 'Excelente servicio',
    rating: 5,
    treatment: ''
  },
  {
    id: 11,
    name: 'Fatima Rodriguez',
    image: 'https://lh3.googleusercontent.com/a/ACg8ocKN81y9Ts5B8Mnt--51C8e_gNzAwWh4GEcTbvN5pyu5eyjWNg=w72-h72-p-rp-mo-br100',
    text: '',
    rating: 5,
    treatment: ''
  },
  {
    id: 12,
    name: 'Verónica Inés Iturbide',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjXBXbxEqDQ89j77IxDCMFxK9Dw2jfdZD4EvhNIVhOUzCpXtsK8YJQ=w72-h72-p-rp-mo-ba3-br100',
    text: '',
    rating: 5,
    treatment: ''
  },
  {
    id: 13,
    name: 'Lorena Arias',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjW3EnWhLaV6eD3b8kNcndhDoOegYCDBGP61LNwz4wWQu2gwTfP9ww=w72-h72-p-rp-mo-br100',
    text: '',
    rating: 5,
    treatment: ''
  },
  {
    id: 14,
    name: 'Hector Adrian Antunez',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjU-vplvAk_zvdKxY6MZ0rA90qpMabxK0QS6LKyvJ3gENhzJVZPB3w=w72-h72-p-rp-mo-ba5-br100',
    text: '',
    rating: 5,
    treatment: ''
  },
  {
    id: 15,
    name: 'Fedra Sigampa',
    image: 'https://lh3.googleusercontent.com/a-/ALV-UjWumPsx8v49f5ex92zJF-Y3fZGiIxQolMzCawn4L_WeZDNztuPDtw=w72-h72-p-rp-mo-ba2-br100',
    text: '',
    rating: 5,
    treatment: ''
  }
];

const Results = () => {
  const [activeTab, setActiveTab] = useState<'cases' | 'testimonials'>('cases');

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-tr from-primary/40 via-primary/80 to-primary-dark/90 py-24 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold mb-6 mt-10"
          >
            Resultados que Transforman Sonrisas
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl max-w-3xl mx-auto"
          >
            Descubre los cambios reales que hemos logrado para nuestros pacientes a través de tratamientos dentales de excelencia.
          </motion.p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6 -mt-8">
        <div className="flex justify-center">
          <div className="flex bg-white rounded-lg shadow-lg overflow-hidden relative z-10">
            <motion.button
              onClick={() => setActiveTab('cases')}
              className={`relative px-8 py-4 font-medium transition-colors duration-300 ${
                activeTab === 'cases' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {activeTab === 'cases' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Casos Clínicos</span>
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('testimonials')}
              className={`relative px-8 py-4 font-medium transition-colors duration-300 ${
                activeTab === 'testimonials' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {activeTab === 'testimonials' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Testimonios</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        <AnimatePresence mode="wait">
          {activeTab === 'cases' ? (
            <motion.section
              key="cases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-20"
            >
              {beforeAfterCases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-2/3 p-4 p-10">
                    <ReactCompareSlider
                      itemOne={
                        <ReactCompareSliderImage
                          src={caseItem.beforeImage}
                          alt="Antes"
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      }
                      itemTwo={
                        <ReactCompareSliderImage
                          src={caseItem.afterImage}
                          alt="Después"
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      }
                      className="h-80 w-full max-h-[500px] rounded-lg overflow-hidden"
                    />

                    </div>
                    <div className="md:w-1/3 p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{caseItem.title}</h2>
                      <p className="text-gray-600 mb-6">{caseItem.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tratamiento</h3>
                          <p className="text-gray-900">{caseItem.treatment}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Duración</h3>
                          <p className="text-gray-900">{caseItem.duration}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.section>
          ) : (
            <motion.section
              key="testimonials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid md:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-black"
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900">{testimonial.name}</h3>
                        <p className="text-sm text-primary font-medium">{testimonial.treatment}</p>
                      </div>
                    </div>
                    <div className="flex mb-4 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 italic">"{testimonial.text}"</p>
                  </div>
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        {/* CTA Section */}
        <section className="mt-24 text-center">
          <div className="bg-[rgb(44,123,183)] rounded-2xl p-12 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-6">¿Listo para transformar tu sonrisa?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Agenda una consulta y descubre cómo podemos ayudarte a lograr la sonrisa que siempre has deseado.
            </p>
            <Link 
              href="/turnos"
              onClick={() => trackReservarTurno('resultados_reservar_consulta')}
              className="inline-block bg-white text-primary font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Reservar Consulta
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Results;