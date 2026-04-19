'use client'

import { motion } from 'framer-motion'
import { Activity, Calendar, Clock, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { GlassCard } from '@/components/ui/GlassCard'
import { CycleStatusBadge } from './CycleStatusBadge'
import type { OdooCycleSummary } from '@/lib/types/ciclo'
import { formatOverdue } from '@/lib/utils/cycleTime'

interface CycleListItemProps {
  cycle: OdooCycleSummary
  index?: number
}

export function CycleListItem({ cycle, index = 0 }: CycleListItemProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      layout
    >
      <GlassCard
        variant="hover"
        noPadding
        className={clsx(
          'cursor-pointer p-4 flex items-center gap-4',
          cycle.state === 'em_andamento' && 'in-progress-glow'
        )}
        onClick={() => router.push(`/ciclos/${cycle.id}`)}
      >
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] lg:grid-cols-[1.4fr_1fr_0.6fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{cycle.name}</p>
            {cycle.equipment_id && (
              <p className="text-xs text-white/50 truncate flex items-center gap-1 mt-0.5">
                <Activity size={10} className="text-neon-blue/70 flex-shrink-0" />
                {cycle.equipment_nickname
                  ? `${cycle.equipment_nickname} · ${cycle.equipment_id[1]}`
                  : cycle.equipment_id[1]}
              </p>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-0.5 text-xs text-white/60">
            {cycle.start_date && (
              <span className="flex items-center gap-1">
                <Calendar size={10} className="text-neon-blue/60" />
                {formatDateTime(cycle.start_date)}
              </span>
            )}
            {cycle.duration !== false && cycle.duration !== null && (
              <span className="flex items-center gap-1 text-white/50">
                <Clock size={10} className="text-neon-blue/60" />
                {formatDuration(cycle.duration)}
              </span>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-0.5 text-xs text-white/60">
            {cycle.batch_number && (
              <span className="flex items-center gap-1">
                <Package size={10} className="text-neon-blue/60" />
                {cycle.batch_number}
              </span>
            )}
            {cycle.end_date && (
              <span className="flex items-center gap-1 text-white/50">
                <Calendar size={10} className="text-neon-blue/60" />
                Fim {formatDateTime(cycle.end_date)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {cycle.is_overdue && (
              <span
                className="overdue-glow inline-flex items-center gap-1 text-[10px] text-neon-pink font-medium whitespace-nowrap"
                title="Atrasado"
              >
                <AlertCircle size={11} />
                {formatOverdue(cycle) || 'Atrasado'}
              </span>
            )}
            {cycle.is_signed && <CheckCircle2 size={13} className="text-neon-green" />}
            <CycleStatusBadge state={cycle.state} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
