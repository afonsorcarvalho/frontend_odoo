'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2 } from 'lucide-react'
import { clsx } from 'clsx'
import { AppSidebar } from './AppSidebar'
import { useUIStore } from '@/lib/store/uiStore'

const PUBLIC_ROUTES = ['/login']
const FULLSCREEN_ROUTES = ['/wall']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isFullscreen = FULLSCREEN_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const dashboardMode = useUIStore((s) => s.dashboardMode) || isFullscreen
  const toggle = useUIStore((s) => s.toggleDashboardMode)

  if (isPublic || isFullscreen) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {!dashboardMode && (
          <motion.div
            key="sidebar"
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          >
            <AppSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggle}
        title={dashboardMode ? 'Sair do modo dashboard' : 'Modo dashboard (tela cheia)'}
        aria-label={dashboardMode ? 'Sair do modo dashboard' : 'Entrar no modo dashboard'}
        className={clsx(
          'fixed top-3 z-40 p-2 rounded-xl border backdrop-blur transition-all',
          'bg-dark-800/80 border-white/10 text-white/70 hover:text-neon-blue hover:border-neon-blue/40 hover:bg-dark-800',
          dashboardMode ? 'left-3' : 'right-3'
        )}
      >
        {dashboardMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      <div
        className={clsx(
          'transition-[padding] duration-300',
          !dashboardMode && 'md:pl-60',
          dashboardMode && 'dashboard-mode'
        )}
      >
        {children}
      </div>
    </div>
  )
}
