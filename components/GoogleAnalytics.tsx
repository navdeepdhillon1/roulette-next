// components/GoogleAnalytics.tsx
'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { GA_MEASUREMENT_ID, pageview } from '@/lib/analytics'

export default function GoogleAnalytics() {
  const pathname = usePathname()

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      pageview(pathname)
    }
  }, [pathname])

  // Don't load in development (optional - remove if you want to test in dev)
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // Don't load if GA ID is not configured
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    return null
  }

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  )
}
