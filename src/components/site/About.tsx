'use client'

import { motion } from 'framer-motion'

// const certifications = [
//   {
//     title: 'Especialista en Ortodoncia',
//     institution: 'Universidad de Buenos Aires',
//     year: '2018'
//   },
//   {
//     title: 'Maestría en Implantología',
//     institution: 'Universidad Nacional de Córdoba',
//     year: '2020'
//   },
//   {
//     title: 'Certificación en Odontología Estética',
//     institution: 'Colegio de Odontólogos',
//     year: '2021'
//   }
// ]

const About = () => {
  return (
    <div className="container mx-auto px-4 py-28 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Sobre la Dra. Jesica</h1>
        
        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src="https://res.cloudinary.com/dnnxgzqzv/image/upload/v1749842376/jesica_exuyvz.webp"
              alt="Dra. Jesica Goroso, odontóloga en Mar del Plata"
              className="object-cover w-full h-full"
            />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              15 años de experiencia en odontología
            </h2>
            <p className="text-gray-600 mb-6">
              La Dra. Jesica es una profesional altamente calificada con más de una década de experiencia
              en el campo de la odontología. Su enfoque se centra en proporcionar atención personalizada
              y tratamientos de la más alta calidad para cada paciente.
            </p>
            <p className="text-gray-600">
              Especializada en Ortodoncia y Ortopedia de maxilares, Odontóloga estética y general.
            </p>
          </div>
        </div>

        {/* Certificaciones */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Certificaciones</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Odontología Estética",
                description: "Certificación en técnicas avanzadas de estética dental"
              },
              /* {
                title: "Implantes Dentales",
                description: "Especialización en colocación de implantes"
              }, */
              {
                title: "Ortodoncia",
                description: "Certificación en ortodoncia moderna"
              }
            ].map((cert, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{cert.title}</h3>
                <p className="text-gray-600">{cert.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Video Section */}
    {/*     <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Conoce más sobre nuestro trabajo</h2>
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/your-video-id"
              title="Video sobre la Dra. Jesica"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section> */}
      </motion.div>
    </div>
  )
}

export default About 