'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'

export interface FilterPanelProps {
  open: boolean
  onClose: () => void
  title?: string
  activeCount: number
  onReset: () => void
  children: ReactNode
}

/**
 * Chassi reutilizável para painéis de filtros (backdrop + aside animado + header).
 * O consumidor passa os controles de filtro específicos via children.
 * Use <FilterSection> interno para padronizar cada bloco.
 */
export function FilterPanel({
  open, onClose, title = 'Filtros', activeCount, onReset, children,
}: FilterPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 z-50 bg-dark-800/95 border-l border-white/10 backdrop-blur-xl flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent" />

            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-white font-semibold">{title}</h2>
                {activeCount > 0 && (
                  <p className="text-xs text-neon-blue mt-0.5">
                    {activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <AnimatedButton
                    variant="ghost"
                    onClick={onReset}
                    icon={<RotateCcw size={14} />}
                    className="text-xs px-3 py-1.5"
                  >
                    Limpar
                  </AnimatedButton>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </section>
  )
}
