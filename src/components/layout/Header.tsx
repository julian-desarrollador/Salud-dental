'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { trackReservarTurno } from '../../lib/analytics'

const navItems = [
  { name: "Inicio", path: "/" },
  { name: "Sobre mí", path: "/sobre-mi" },
  { name: "Servicios", path: "/servicios" },
  { name: "Resultados", path: "/resultados" },
  { name: "Contacto", path: "/contacto" },
]

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Dra. Jesica</span>
            <h1 className="text-lg font-semibold leading-6 text-gray-900">Od. Jesica Brenda Goroso</h1>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">Abrir menú principal</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm font-semibold leading-6 ${
                pathname === item.path ? 'text-primary' : 'text-gray-900 hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        {/* Right side - Turnos online link */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link
            href="/turnos"
            onClick={() => trackReservarTurno('header_turnos_desktop')}
            className={`text-sm font-semibold leading-6 ${
              pathname === '/turnos' ? 'text-primary' : 'text-gray-900 hover:text-primary'
            }`}
          >
            Turnos online <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween' }}
            className="lg:hidden fixed inset-0 z-40"
            role="dialog"
            aria-modal="true"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={toggleMobileMenu} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5">
                  <span className="sr-only">Dra. Jesica</span>
                  <h1 className="text-lg font-semibold leading-6 text-gray-900">Dra. Jesica</h1>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={toggleMobileMenu}
                >
                  <span className="sr-only">Cerrar menú</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                          pathname === item.path ? 'text-primary' : 'text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6">
                    <Link
                      href="/turnos"
                      className={`-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 ${
                        pathname === '/turnos' ? 'text-primary' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        trackReservarTurno('header_turnos_mobile')
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      Turnos online
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header