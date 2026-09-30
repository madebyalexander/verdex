"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IoCheckmarkCircle as CheckCircle, IoInformationCircle as InfoCircle, IoWarning as WarningTriangle, IoRefreshCircle as RefreshCircle } from 'react-icons/io5'
const Toaster = ({ ...props }: ToasterProps) => {
  // Dark mode only — never follow the OS preference.
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" />,
        info: <InfoCircle className="size-4" />,
        warning: <WarningTriangle className="size-4" />,
        error: <WarningTriangle className="size-4" />,
        loading: <RefreshCircle className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
