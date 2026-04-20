'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { ArrowLeft, Activity } from 'lucide-react'
import ciclosApi from '@/lib/odoo/ciclos'
import { useCiclosBus } from '@/lib/hooks/useCiclosBus'
import type { OdooCycleSummary } from '@/lib/types/ciclo'
import { CycleActiveHeader } from '@/components/ciclos/CycleActiveHeader'
import { CyclePhaseBar } from '@/components/ciclos/CyclePhaseBar'

const DEFAULT_FILTERS = {
  search: '',
  state: 'em_andamento' as const,
  only_overdue: false,
  only_signed: false,
}

export default function WallPage() {
  const router = useRouter()
  useCiclosBus()

  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['ciclos-wall'],
    queryFn: async () => {
      const r = await ciclosApi.listPage(DEFAULT_FILTERS, 0, 100)
      return r.records
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })

  const cycles = data ?? []

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/ciclos')}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
              title="Voltar para ciclos"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <motion.div
              className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20"
              animate={{ boxShadow: ['0 0 10px rgba(0,212,255,0.1)', '0 0 24px rgba(0,212,255,0.35)', '0 0 10px rgba(0,212,255,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Activity size={18} className="text-neon-blue" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Parede · Ciclos em Andamento
              </h1>
              <p className="text-[10px] text-white/40">
                {cycles.length} {cycles.length === 1 ? 'ciclo ativo' : 'ciclos ativos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <SyncBadge />
            <WallClock now={now} />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-white/40 text-sm">
            <div className="w-4 h-4 mr-2 border-2 border-neon-blue/40 border-t-neon-blue rounded-full animate-spin" />
            Carregando ciclos ativos...
          </div>
        ) : cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Activity size={36} className="text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Nenhum ciclo em andamento</h3>
            <p className="text-white/40 text-sm">Os ciclos ativos aparecerão aqui em tempo real.</p>
          </div>
        ) : (
          <div className="grid gap-4 wall-auto-grid">
            <AnimatePresence mode="popLayout">
              {cycles.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <WallCard cycle={c} onOpen={() => router.push(`/ciclos/${c.id}`)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style jsx>{`
        .wall-auto-grid {
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
        }
      `}</style>
    </div>
  )
}

function WallClock({ now }: { now: Date | null }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-[9px] uppercase tracking-wider text-white/40 mb-1">Hora local</span>
      <span className="font-mono tabular-nums text-lg text-white/85">
        {now ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
      </span>
    </div>
  )
}

function SyncBadge() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-neon-green animate-ping opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
        Sincronizado · SSE
      </span>
    </div>
  )
}

function WallCard({ cycle, onOpen }: { cycle: OdooCycleSummary; onOpen: () => void }) {
  const overdue = cycle.is_overdue
  return (
    <div
      onClick={onOpen}
      className={clsx(
        'cursor-pointer rounded-2xl border p-5 backdrop-blur-xl transition-colors',
        overdue
          ? 'bg-dark-800/60 border-neon-pink/25 overdue-card-glow'
          : 'bg-dark-800/60 border-white/10 in-progress-glow'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{cycle.name}</h3>
          {cycle.equipment_id && (
            <p className="text-xs text-white/50 mt-1 truncate">
              {cycle.equipment_id[1]}
            </p>
          )}
          {cycle.batch_number && (
            <p className="text-[11px] text-white/40 mt-0.5 font-mono tracking-wider">
              Lote {cycle.batch_number}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 min-w-0 max-w-[55%]">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border',
              overdue
                ? 'bg-neon-pink/15 text-neon-pink border-neon-pink/30'
                : 'bg-neon-green/15 text-neon-green border-neon-green/30'
            )}
          >
            <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', overdue ? 'bg-neon-pink' : 'bg-neon-green')} />
            {overdue ? 'Atrasado' : 'Em andamento'}
          </span>
          {cycle.equipment_nickname && (
            <span
              className="text-3xl font-black uppercase tracking-tight text-white leading-none truncate max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              title={cycle.equipment_nickname}
            >
              {cycle.equipment_nickname}
            </span>
          )}
        </div>
      </div>

      <CycleActiveHeader cycle={cycle} size="lg" className="mb-4" />

      <CyclePhaseBar cycle={cycle} variant="full" showHeader={false} />
    </div>
  )
}
