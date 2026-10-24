'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { FaWhatsapp } from 'react-icons/fa';
import * as Yup from 'yup'
import { FormikHelpers } from 'formik'
import { trackWhatsApp } from '../../lib/analytics'

interface FormValues {
  name: string
  email: string
  phone: string
  message: string
}

const validationSchema = Yup.object({
  name: Yup.string().required('El nombre es requerido'),
  email: Yup.string()
    .required('El email es requerido')
    .matches(
      /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/,
      'Por favor, ingresa un email válido'
    ),
  phone: Yup.string().required('El teléfono es requerido'),
  message: Yup.string().required('El mensaje es requerido')
})

const Contact = ({ fromConsultar = false }: { fromConsultar?: boolean }) => {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (_values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    try {
      // Aquí iría la lógica para enviar el formulario
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulación de envío
      setSubmitSuccess(true)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-6 sm:px-4 py-28 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {fromConsultar && (
          <div className="mb-4">
            <button
              aria-label="Volver"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.78 3.72a.75.75 0 010 1.06L9.56 11l6.22 6.22a.75.75 0 11-1.06 1.06l-6.75-6.75a.75.75 0 010-1.06l6.75-6.75a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
              <span>Volver</span>
            </button>
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contacto</h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Formulario de Contacto */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Envíanos un mensaje
            </h2>
            <Formik
              initialValues={{
                name: '',
                email: '',
                phone: '',
                message: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-8">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                      Nombre completo
                    </label>
                    <div className="mt-2">
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                      Email
                    </label>
                    <div className="mt-2">
                      <Field
                        type="text"
                        id="email"
                        name="email"
                        className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                      Teléfono
                    </label>
                    <div className="mt-2">
                      <Field
                        type="tel"
                        id="phone"
                        name="phone"
                        className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                      />
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">
                      Mensaje
                    </label>
                    <div className="mt-2">
                      <Field
                        as="textarea"
                        id="message"
                        name="message"
                        rows={4}
                        minLength={10}
                        maxLength={500}
                        style={{ minHeight: '100px', maxHeight: '200px' }}
                        className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                      />
                      <ErrorMessage
                        name="message"
                        component="div"
                        className="mt-2 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary rounded-none px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                  </div>

                  <div>
                          <a
                            href="https://wa.me/5492236160437?text=Hola! Quiero consultar por Salud Dental."
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackWhatsApp('contacto_contactar_whatsapp')}
                            className="w-full flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-sm font-semibold rounded-none shadow-sm transition-colors"
                          >
                            <FaWhatsapp className="w-5 h-5" />
                            Contactar por WhatsApp
                          </a>

                  </div>


                  {submitSuccess && (
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          </div>

          {/* Información de Contacto y Mapa */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Información de contacto
            </h2>
            <div className="space-y-6 mb-8">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Dirección</h3>
                <p className="text-gray-600 flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a
                    href="https://maps.app.goo.gl/JAwcA8i5ZAFmUNfb7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    San Lorenzo 2908<br />
                    (entre Hipólito Yrigoyen y La Rioja)<br />
                    Mar del Plata.
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Teléfono</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  2236160437
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  saluddentaljg@gmail.com
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Horario</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lunes de 13:30 a 19 hs<br />
                  Martes de 9 a 17 hs<br />
                  Miércoles de 13:30 a 19 hs<br />
                  Jueves: Cerrado<br />
                  Viernes de 9 a 17 hs<br />
                  
                </p>
              </div>
            </div>

          {/* Mapa */}
          <div className="rounded-lg overflow-hidden w-full h-96"> {/* Altura fija recomendada */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2180.4673536383034!2d-57.56182889714035!3d-38.009915326287235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9584d955561af495%3A0xb8b6926726c5b2fa!2sSALUD%20DENTAL%20Mar%20del%20Plata!5e0!3m2!1ses!2sar!4v1785450928199!5m2!1ses!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false} // Evita el modo pantalla completa que puede redirigir
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-auto select-none" // select-none evita selección de texto accidental
              title="Ubicación del consultorio"
            />
          </div>
          
          </div>
        </div>
      </motion.div>

    </div>
  )
}

export default Contact 