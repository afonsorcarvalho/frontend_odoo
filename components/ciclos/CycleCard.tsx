'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Package, Activity, AlertCircle, CheckCircle2, Beaker, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { CycleStatusBadge } from './CycleStatusBadge'
import { CyclePhaseBar } from './CyclePhaseBar'
import { CycleActiveHeader } from './CycleActiveHeader'
import type { OdooCycleSummary } from '@/lib/types/ciclo'
import { formatOverdue } from '@/lib/utils/cycleTime'
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CycleCardProps {
  cycle: OdooCycleSummary
  index?: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 260, damping: 20 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export function CycleCard({ cycle, index = 0 }: CycleCardProps) {
  const router = useRouter()

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
    >
      <GlassCard
        variant="hover"
        noPadding
        className={clsx(
          'cursor-pointer group relative p-5 h-full',
          cycle.state === 'em_andamento' && 'in-progress-glow'
        )}
        onClick={() => router.push(`/ciclos/${cycle.id}`)}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {cycle.name}
            </h3>
            {cycle.equipment_id && (
              <p className="text-xs text-white/50 mt-1 truncate flex items-center gap-1">
                <Activity size={10} className="text-neon-blue/70" />
                {cycle.equipment_nickname
                  ? `${cycle.equipment_nickname} · ${cycle.equipment_id[1]}`
                  : cycle.equipment_id[1]}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <CycleStatusBadge state={cycle.state} />
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

        <div className="space-y-1.5">
          {cycle.start_date && (
            <InfoRow
              icon={<Calendar size={11} />}
              label="Início"
              value={formatDateTime(cycle.start_date)}
            />
          )}
          {cycle.duration !== false && cycle.duration !== null && (
            <InfoRow
              icon={<Clock size={11} />}
              label="Duração"
              value={formatDuration(cycle.duration)}
            />
          )}
          {cycle.batch_number && (
            <InfoRow
              icon={<Package size={11} />}
              label="Lote"
              value={cycle.batch_number}
            />
          )}
          {cycle.end_date && (
            <InfoRow
              icon={<Calendar size={11} />}
              label="Fim"
              value={formatDateTime(cycle.end_date)}
            />
          )}
        </div>

        {cycle.state === 'em_andamento' && (
          <div className="mt-3 space-y-2">
            <CycleActiveHeader cycle={cycle} size="sm" />
            <CyclePhaseBar cycle={cycle} variant="compact" />
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          {cycle.is_overdue && (
            <span className="overdue-glow inline-flex items-center gap-1 text-[10px] text-neon-pink font-medium">
              <AlertCircle size={10} />
              {formatOverdue(cycle) ? `Atrasado · ${formatOverdue(cycle)}` : 'Atrasado'}
            </span>
          )}
          {cycle.is_signed && (
            <span className="inline-flex items-center gap-1 text-[10px] text-neon-green font-medium">
              <CheckCircle2 size={10} /> Assinado
            </span>
          )}
          {cycle.ib_resultado && (
            <span className={clsx(
              'inline-flex items-center gap-1 text-[10px] font-medium',
              cycle.ib_resultado === 'positivo' ? 'text-neon-pink' : 'text-neon-green'
            )}>
              <Beaker size={10} /> IB {cycle.ib_resultado}
            </span>
          )}
          {cycle.material_count !== false && cycle.material_count !== null && cycle.material_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/50 ml-auto">
              <Package size={10} /> {cycle.material_count}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-10 flex items-center justify-center bg-gradient-to-t from-neon-blue/10 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-neon-blue font-medium flex items-center gap-1">
            Ver detalhes <ExternalLink size={10} />
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-neon-blue/70 flex-shrink-0">{icon}</span>
      <span className="text-white/40 w-14 flex-shrink-0">{label}</span>
      <span className="text-white/80 truncate">{value}</span>
    </div>
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
