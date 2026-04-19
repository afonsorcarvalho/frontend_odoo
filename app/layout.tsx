import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ErrorReporter } from '@/components/providers/ErrorReporter'
import { AuthGuard } from '@/components/providers/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Contatos | Odoo CRM',
  description: 'Gerenciamento de contatos Odoo 16',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className="bg-dark-900 text-white antialiased min-h-screen"
        suppressHydrationWarning
      >
        <QueryProvider>
          <ErrorReporter />
          <div className="fixed inset-0 bg-dark-900 bg-mesh-gradient -z-10" />
          <div
            className="fixed top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none -z-10 animate-float"
            aria-hidden
          />
          <div
            className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none -z-10 animate-float"
            style={{ animationDelay: '-3s' }}
            aria-hidden
          />

          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(10, 15, 30, 0.95)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error: { iconTheme: { primary: '#ec4899', secondary: 'white' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
