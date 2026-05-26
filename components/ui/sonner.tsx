'use client'

import { useEffect, useState } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = (props: ToasterProps) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position={isMobile ? 'top-center' : 'top-right'}
      richColors
      closeButton
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
