'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_MEASUREMENT_ID = 'G-X0ZLVK8D41'

export default function GoogleAnalytics() {
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  useEffect(() => {
    if (pathname.startsWith('/consultorio')) return
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag

    if (typeof gtag === 'function') {
      gtag('config', GA_MEASUREMENT_ID, {
        page_path: search ? `${pathname}?${search}` : pathname,
      })
    }
  }, [pathname, search])

  return null
}
