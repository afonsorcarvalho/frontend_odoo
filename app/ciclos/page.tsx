'use client'

import { useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { LayoutGrid, List, SlidersHorizontal, Activity } from 'lucide-react'
import { clsx } from 'clsx'
import { useCiclos } from '@/lib/hooks/useCiclos'
import { useCiclosBus } from '@/lib/hooks/useCiclosBus'
import { useCiclosStore } from '@/lib/store/ciclosStore'
import { CycleCard } from '@/components/ciclos/CycleCard'
import { CycleListItem } from '@/components/ciclos/CycleListItem'
import { SearchBar } from '@/components/ciclos/SearchBar'
import { FilterPanel } from '@/components/ciclos/FilterPanel'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function CiclosPage() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCiclos()
  const { ui, setViewMode, openFilterPanel, filters } = useCiclosStore()
  useCiclosBus()

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const cycles = data?.allCycles ?? []
  const total = data?.total ?? 0

  const activeFilters =
    (filters.state ? 1 : 0) +
    (filters.equipment_id ? 1 : 0) +
    (filters.cycle_type_id ? 1 : 0) +
    (filters.only_overdue ? 1 : 0) +
    (filters.only_signed ? 1 : 0) +
    (filters.date_from ? 1 : 0) +
    (filters.date_to ? 1 : 0)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20"
                animate={{ boxShadow: ['0 0 10px rgba(0,212,255,0.1)', '0 0 20px rgba(0,212,255,0.3)', '0 0 10px rgba(0,212,255,0.1)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Activity size={20} className="text-neon-blue" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  Ciclos de Esterilização
                </h1>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={total}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-white/40"
                  >
                    {isLoading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} ciclos`}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                <ViewToggle active={ui.viewMode === 'grid'} onClick={() => setViewMode('grid')} icon={<LayoutGrid size={15} />} label="Grid" />
                <ViewToggle active={ui.viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={15} />} label="Lista" />
              </div>

              <AnimatedButton
                variant="ghost"
                onClick={openFilterPanel}
                icon={<SlidersHorizontal size={15} />}
                className="relative"
              >
                Filtros
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-blue text-[10px] font-bold flex items-center justify-center text-dark-900">
                    {activeFilters}
                  </span>
                )}
              </AnimatedButton>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar isLoading={isLoading} totalResults={isLoading ? undefined : total} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={ui.viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-2'}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingSkeleton key={i} variant={ui.viewMode === 'grid' ? 'card' : 'list'} />
              ))}
            </motion.div>
          ) : cycles.length === 0 ? (
            <EmptyState key="empty" />
          ) : ui.viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {cycles.map((c, i) => (
                <CycleCard key={c.id} cycle={c} index={i % 24} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {cycles.map((c, i) => (
                <CycleListItem key={c.id} cycle={c} index={i % 24} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={sentinelRef} className="h-20 flex items-center justify-center mt-4">
          {isFetchingNextPage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-white/40 text-sm"
            >
              <div className="w-4 h-4 border-2 border-neon-blue/40 border-t-neon-blue rounded-full animate-spin" />
              Carregando mais...
            </motion.div>
          )}
        </div>
      </main>

      <FilterPanel />
    </div>
  )
}

function ViewToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      title={label}
      whileTap={{ scale: 0.9 }}
      className={clsx(
        'p-1.5 rounded-lg transition-all',
        active ? 'bg-neon-blue/20 text-neon-blue' : 'text-white/40 hover:text-white/70'
      )}
    >
      {icon}
    </motion.button>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mb-6"
        animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.1)', '0 0 40px rgba(0,212,255,0.3)', '0 0 20px rgba(0,212,255,0.1)'] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Activity size={36} className="text-neon-blue/60" />
      </motion.div>
      <h3 className="text-xl font-semibold text-white mb-2">Nenhum ciclo encontrado</h3>
      <p className="text-white/40 text-sm max-w-sm">
        Ajuste os filtros ou verifique se há ciclos cadastrados no Odoo.
      </p>
    </motion.div>
  )
}
