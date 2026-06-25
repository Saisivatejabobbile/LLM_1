'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      richColors
      theme="dark"
      toastOptions={{
        style: {
          background: '#12121a',
          border: '1px solid #2a2a3e',
          color: '#e2e8f0',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(12px)',
        },
        className: 'toast-custom',
        duration: 4000,
      }}
    />
  )
}
