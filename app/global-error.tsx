'use client'

import { useEffect } from 'react'

// global-error replaces the ENTIRE app shell (root layout failed),
// so it must render its own <html> and <body>. Keep inline styles only —
// CSS imports may also have failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          background: '#0a0a0a',
          color: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '40px 24px',
          margin: 0,
          minHeight: '100vh',
        }}
      >
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>
            Something went very wrong
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            The app shell failed to load. This is a bug — please retry.
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              opacity: 0.5,
              marginBottom: 24,
              fontFamily: 'ui-monospace, monospace',
              wordBreak: 'break-all',
            }}
          >
            {error.message}
            {error.digest && ` (id: ${error.digest})`}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              background: '#ad46ff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
