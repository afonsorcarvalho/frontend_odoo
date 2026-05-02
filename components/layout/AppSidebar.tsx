'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Activity, Users, Wrench, LogOut, Building2, MonitorPlay, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store/authStore'
import { odooClient } from '@/lib/odoo/client'
import { resetSessionCache } from '@/lib/store/resetSessionCache'
import { fetchAvailableCompanies } from '@/lib/odoo/companies'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  matchPrefix?: string
}

const ITEMS: NavItem[] = [
  { href: '/ciclos',   label: 'Ciclos',   icon: <Activity size={18} />, matchPrefix: '/ciclos' },
  { href: '/wall',     label: 'Parede de TVs', icon: <MonitorPlay size={18} />, matchPrefix: '/wall' },
  { href: '/os',       label: 'Ordens de Serviço', icon: <Wrench size={18} />, matchPrefix: '/os' },
  { href: '/contacts', label: 'Contatos', icon: <Users size={18} />, matchPrefix: '/contacts' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const { logout, userName, companyName, companyLogo, availableCompanies, selectedCompanyId, setAvailableCompanies, setSelectedCompany } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchAvailableCompanies()
      .then(setAvailableCompanies)
      .catch(() => { /* sem acesso a res.company — ignora */ })
  }, [setAvailableCompanies])

  const handleLogout = async () => {
    try { await odooClient.logout() } catch { /* ignora */ }
    logout()
    odooClient.reset()
    resetSessionCache(queryClient)
    router.push('/login')
  }

  const isActive = (item: NavItem) => {
    if (!item.matchPrefix) return pathname === item.href
    return pathname === item.href || pathname?.startsWith(item.matchPrefix + '/')
  }

  const sidebarProps = {
    items: ITEMS,
    isActive,
    userName,
    companyName,
    companyLogo,
    availableCompanies,
    selectedCompanyId,
    onSelectCompany: setSelectedCompany,
    onLogout: handleLogout,
  }

  return (
    <>
      {/* Botão hamburger (mobile) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-dark-800/90 backdrop-blur border border-white/10 text-white hover:bg-white/10"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col border-r border-white/5 bg-dark-900/60 backdrop-blur-xl z-30">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r border-white/5 bg-dark-900/95 backdrop-blur-xl z-50"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <span className="text-sm font-semibold text-white/80">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                  <X size={16} />
                </button>
              </div>
              <SidebarContent {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({
  items, isActive, userName, companyName, companyLogo,
  availableCompanies, selectedCompanyId, onSelectCompany,
  onLogout, onNavigate,
}: {
  items: NavItem[]
  isActive: (item: NavItem) => boolean
  userName: string | null
  companyName: string | null
  companyLogo: string | null
  availableCompanies: { id: number; name: string }[]
  selectedCompanyId: number | null
  onSelectCompany: (id: number | null) => void
  onLogout: () => void
  onNavigate?: () => void
}) {
  const [companyOpen, setCompanyOpen] = useState(false)

  const selectedName = selectedCompanyId
    ? availableCompanies.find((c) => c.id === selectedCompanyId)?.name ?? companyName
    : null

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex flex-col items-start gap-2 min-w-0">
          {companyLogo ? (
            <img
              src={`data:image/png;base64,${companyLogo}`}
              alt={companyName ?? ''}
              className="max-w-full max-h-16 rounded-xl object-contain border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Building2 size={18} className="text-white/40" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent truncate">
              {companyName ?? 'Empresa'}
            </p>
            <p className="text-[10px] text-white/40 truncate">Supervisório</p>
          </div>
        </div>

        {availableCompanies.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setCompanyOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/70 hover:text-white transition-all"
            >
              <span className="truncate">{selectedName ?? 'Todas as empresas'}</span>
              <ChevronDown size={12} className={clsx('flex-shrink-0 transition-transform', companyOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {companyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-white/10 bg-dark-800/95 backdrop-blur shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => { onSelectCompany(null); setCompanyOpen(false) }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-xs transition-colors',
                      selectedCompanyId === null
                        ? 'text-neon-blue bg-neon-blue/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    Todas as empresas
                  </button>
                  {availableCompanies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { onSelectCompany(c.id); setCompanyOpen(false) }}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-xs transition-colors',
                        selectedCompanyId === c.id
                          ? 'text-neon-blue bg-neon-blue/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-3 space-y-2">
        <div className="flex items-center gap-2 px-2 py-1 min-w-0">
          <motion.div
            className="p-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex-shrink-0"
            animate={{ boxShadow: ['0 0 6px rgba(0,212,255,0.1)', '0 0 14px rgba(0,212,255,0.3)', '0 0 6px rgba(0,212,255,0.1)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Activity size={12} className="text-neon-blue" />
          </motion.div>
          <span className="text-xs text-white/70 truncate">Odoo Frontend</span>
        </div>
        {userName && (
          <p className="px-2 text-[11px] text-white/40 truncate">{userName}</p>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  )
}
