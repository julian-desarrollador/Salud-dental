'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackWhatsApp } from '../../lib/analytics'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { FormikHelpers } from 'formik'

// Helper function to format date
const formatDate = (date: Date, format: string) => {
  if (format === 'dayAndDate') {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  }
  if (format === 'monthDay') {
      return new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric' }).format(date);
  }
  // Default to 'YYYY-MM-DD'
  return date.toISOString().split('T')[0];
};

// Helper function to get days in a week
const getWeekDays = (start: Date) => {
  const days = [];
  const currentDay = new Date(start);
  currentDay.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDay);
    day.setDate(currentDay.getDate() + i);
    days.push(day);
  }
  return days;
};

// Simulación de datos de reservas (en un caso real, esto vendría de una API)
const reservedDates = [
  { date: '2024-03-20', times: ['09:00', '10:30', '14:00'] },
  { date: '2024-03-21', times: ['11:00', '15:30', '16:30'] },
  { date: '2024-03-22', times: ['09:30', '13:00', '17:00'] }
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

// Función para verificar si un horario está reservado
const isTimeReserved = (dateStr: string, time: string) => {
  const reservedDate = reservedDates.find(d => d.date === dateStr);
  return reservedDate?.times.includes(time);
};

// Función para obtener los horarios disponibles para una fecha específica
const getAvailableTimes = (dateStr: string) => {
  const reservedDate = reservedDates.find(d => d.date === dateStr);
  return timeSlots.filter(time => !reservedDate?.times.includes(time));
};

const validationSchema = Yup.object({
  name: Yup.string().required('El nombre es requerido'),
  email: Yup.string()
    .required('El email es requerido')
    .matches(
      /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/,
      'Por favor, ingresa un email válido'
    ),
  phone: Yup.string()
    .required('El teléfono es requerido')
    .matches(/^[0-9]+$/, 'El número de teléfono debe ser válido')
    .min(10, 'El número de teléfono debe ser valido')
    .max(15, 'El número de teléfono debe ser valido'),
  date: Yup.date()
    .required('La fecha es requerida')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'La fecha debe ser futura'),
  time: Yup.string()
    .required('Debes seleccionar el horario'),
  service: Yup.string()
    .required('El servicio es requerido'),
  notes: Yup.string()
});

const services = [
  { id: 'consultation', name: 'Consulta General' },
  { id: 'cleaning', name: 'Limpieza Dental' },
  { id: 'whitening', name: 'Blanqueamiento' },
  { id: 'orthodontics', name: 'Ortodoncia' },
  { id: 'implants', name: 'Implantes' },
  { id: 'other', name: 'Otro' }
];

const Appointments = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });

  // Refs para cada campo del formulario
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const formRef = useRef<HTMLDivElement>(null); // Ref para el contenedor del formulario

  // Función para navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
    setSelectedDate(null); // Deseleccionar la fecha al cambiar de semana
  };

  // Handle date selection from the UI
  const handleDateSelection = (date: Date, setFieldValue: (field: string, value: any) => void) => {
    const formattedDate = formatDate(date, 'YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setFieldValue('date', formattedDate);
    setFieldValue('time', ''); // Reset time when date changes
  };

  // Función para encontrar el primer campo con error y hacer scroll
  const scrollToFirstError = (errors: any) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length === 0) return;

    const refs = {
      name: nameRef,
      email: emailRef,
      phone: phoneRef,
      date: dateRef,
      time: timeRef,
      service: serviceRef,
      notes: notesRef
    };

    // Encontrar el primer campo con error
    for (const field of errorFields) {
      const ref = refs[field as keyof typeof refs];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.current.focus();
        break;
      }
    }
  };

  const handleSubmit = async (_values: any, { setSubmitting }: FormikHelpers<any>) => {
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
    <div className="container mx-auto px-4 py-28 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Reservar Turno</h1>
        <div className="bg-none p-8 rounded-lg shadow-sm text-center mb-8">
          {/* <p className="text-lg text-gray-700 mb-6">Coordiná tu turno por WhatsApp para una atención más rápida.</p> */}
          <a
            href="https://wa.me/5492236160437?text=Hola! Quiero reservar un turno en Salud Dental."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp('turnos_contactar_whatsapp')}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-full shadow-sm transition-colors"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Contactar por WhatsApp
          </a>
        </div>

        <div className="hidden" ref={formRef}>
          <Formik
            initialValues={{
              name: '',
              email: '',
              phone: '',
              date: '',
              time: '',
              service: '',
              notes: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue, values, errors, submitCount }) => {
              // Scroll al primer error cuando se intenta enviar el formulario
              useEffect(() => {
                if (submitCount > 0 && Object.keys(errors).length > 0) {
                  scrollToFirstError(errors);
                }
              }, [submitCount, errors]);

              return (
                <Form className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Nombre completo
                      </label>
                      <div className="mt-2">
                        <Field
                          innerRef={nameRef}
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
                          innerRef={emailRef}
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
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                      Teléfono
                    </label>
                    <div className="mt-2">
                      <Field
                        innerRef={phoneRef}
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

                  {/* Date and Time Selection */}
                  <div className="space-y-6" ref={dateRef}>
                      <h2 className="text-2xl font-semibold text-gray-900">¿Cuándo te gustaría tu cita?</h2>

                      {/* Week Navigation Header */}
                      <div className="flex items-center justify-center p-2 rounded-md bg-primary text-white gap-4">
                          <button type="button" onClick={() => navigateWeek('prev')} className="p-1 rounded-full hover:bg-primary/80 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <div className="flex flex-col items-center">
                              <span className="text-xs opacity-80">{currentWeekStart.getFullYear()}</span>
                              <span className="text-lg font-bold">
                                  {formatDate(currentWeekStart, 'monthDay')} - {formatDate(getWeekDays(currentWeekStart)[6], 'monthDay')}
                              </span>
                          </div>
                          <button type="button" onClick={() => navigateWeek('next')} className="p-1 rounded-full hover:bg-primary/80 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                      </div>

                      {/* Day Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                          {getWeekDays(currentWeekStart).map(day => {
                              const formattedDayStr = formatDate(day, 'YYYY-MM-DD');
                              const isSelected = selectedDate === formattedDayStr;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0); // Normalize to start of day
                              const dayForComparison = new Date(day);
                              dayForComparison.setHours(0, 0, 0, 0);
                              const isPastDate = dayForComparison < today;

                              // Check if all time slots for this day are reserved
                              const hasAvailableSlots = getAvailableTimes(formattedDayStr).length > 0;
                              const isFullyBooked = !isPastDate && !hasAvailableSlots;

                              return (
                                  <button
                                      key={formattedDayStr}
                                      type="button"
                                      onClick={() => handleDateSelection(day, setFieldValue)}
                                      disabled={isPastDate || isFullyBooked}
                                      className={`p-3 rounded-md text-center transition-colors
                                          ${isSelected
                                              ? 'bg-primary text-white shadow-md'
                                              : isFullyBooked
                                                  ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed'
                                                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}
                                          ${isPastDate ? 'opacity-50 cursor-not-allowed' : ''}
                                      `}
                                  >
                                      <span className="block font-semibold uppercase text-xs">
                                        {formatDate(day, 'dayAndDate').split(' ')[0].replace('.', '')}
                                      </span>
                                      <span className="block text-base">
                                        {formatDate(day, 'dayAndDate').split(' ')[1]} {formatDate(day, 'dayAndDate').split(' ')[2]}
                                      </span>
                                  </button>
                              );
                          })}
                      </div>
                      <ErrorMessage name="date" component="div" className="mt-2 text-sm text-red-600" />

                      {/* Time Slots for Selected Date */}
                      {selectedDate && (
                          <div ref={timeRef}>
                              <p className="text-lg font-semibold text-gray-900 mb-4">Selecciona un horario:</p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                  {timeSlots.map(time => {
                                      const isReserved = isTimeReserved(selectedDate, time);
                                      const isSelectedTime = values.time === time;
                                      const now = new Date();
                                      const selectedDateTime = new Date(`${selectedDate}T${time}:00`);
                                      const isPastTime = selectedDateTime < now;

                                      return (
                                          <button
                                              key={time}
                                              type="button"
                                              onClick={() => setFieldValue('time', time)}
                                              disabled={isReserved || isPastTime}
                                              className={`py-2 px-3 rounded-md border text-center transition-colors
                                                  ${isReserved || isPastTime
                                                      ? 'bg-red-100 text-red-600 cursor-not-allowed border-red-200'
                                                      : isSelectedTime
                                                          ? 'bg-primary text-white border-primary'
                                                          : 'bg-white text-gray-900 hover:bg-gray-100 border-gray-300'}
                                              `}
                                          >
                                              {time}
                                          </button>
                                      );
                                  })}
                              </div>
                              <ErrorMessage name="time" component="div" className="mt-2 text-sm text-red-600" />
                          </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium leading-6 text-gray-900">
                        Servicio
                      </label>
                      <div className="mt-2">
                        <Field
                          innerRef={serviceRef}
                          as="select"
                          id="service"
                          name="service"
                          className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                        >
                          <option value="">Seleccionar servicio</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="service"
                          component="div"
                          className="mt-2 text-sm text-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
                        Notas adicionales
                      </label>
                      <div className="mt-2">
                        <Field
                          innerRef={notesRef}
                          as="textarea"
                          id="notes"
                          name="notes"
                          rows={4}
                          className="block rounded-none w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                        />
                        <ErrorMessage
                          name="notes"
                          component="div"
                          className="mt-2 text-sm text-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary rounded-none px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                      >
                        {isSubmitting ? 'Reservando...' : 'Reservar turno'}
                      </button>
                    </div>

                    {submitSuccess && (
                  <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 flex items-center justify-center z-50 !p-0 !m-0"
                >
                  <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center transform scale-y-100 origin-center !m-0">


                    <div className="flex flex-col items-center justify-center mb-6">
                      <svg className="h-20 w-20 text-green-500 mb-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">¡Turno reservado con éxito!</h3>
                      <p className="text-gray-700 text-xl">
                        Te enviaremos un email de confirmación con todos los detalles de tu cita.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(false)}
                      className="bg-primary rounded-md px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
                    )}
                  </Form>
                );
              }}
            </Formik>
          </div>

          {/* Información adicional */}
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Horarios de atención</h3>
              <p className="text-gray-600">
                Lunes y Miércoles: 13:30 a 19&nbsp;hs<br />
                Martes y Viernes: 9 a 17&nbsp;hs<br />
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Duración de la consulta</h3>
              <p className="text-gray-600">
              La consulta tiene una duración de 30 min. Te recomendamos ser puntual.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelaciones</h3>
              <p className="text-gray-600">
                Si necesitas cancelar o reprogramar tu turno, por favor hazlo con al menos
                24 horas de anticipación.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

export default Appointments 