'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Wrench, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { GlassCard } from '@/components/ui/GlassCard'
import { useOsStore } from '@/lib/store/osStore'
import { OsStatusBadge } from './OsStatusBadge'
import { OsPriorityBadge } from './OsPriorityBadge'
import {
  MAINTENANCE_TYPE_LABEL,
  type OdooOsSummary,
  isOsOverdue,
  isOsScheduledToday,
  isOsDimmed,
} from '@/lib/types/os'

interface OsListItemProps {
  os: OdooOsSummary
  index?: number
}

export function OsListItem({ os, index = 0 }: OsListItemProps) {
  const router = useRouter()
  const loadingDetailId = useOsStore((s) => s.loadingDetailId)
  const setLoadingDetailId = useOsStore((s) => s.setLoadingDetailId)
  const loading = loadingDetailId === os.id
  const dimmed = isOsDimmed(os)
  const overdue = !dimmed && isOsOverdue(os)
  const scheduledToday = !dimmed && !overdue && isOsScheduledToday(os)

  const handleClick = () => {
    setLoadingDetailId(os.id)
    router.push(`/os/${os.id}`)
  }

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
          'cursor-pointer p-4 relative transition-opacity',
          overdue && 'overdue-card-glow',
          scheduledToday && 'scheduled-today-glow',
          dimmed && 'opacity-50 grayscale-[40%] hover:opacity-75',
          loading && 'pointer-events-none'
        )}
        onClick={handleClick}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-dark-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-neon-blue text-xs font-medium">
              <Loader2 size={14} className="animate-spin" />
              Abrindo...
            </div>
          </div>
        )}
        <div className="min-w-0 grid grid-cols-[1fr_auto] lg:grid-cols-[1.4fr_1fr_0.8fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{os.name}</p>
            {os.equipment_id && (
              <p className="text-xs text-white/50 truncate flex items-center gap-1 mt-0.5">
                <Wrench size={10} className="text-neon-blue/70 flex-shrink-0" />
                {os.equipment_apelido
                  ? `${os.equipment_apelido} · ${os.equipment_id[1]}`
                  : os.equipment_id[1]}
              </p>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-0.5 text-xs text-white/60">
            {os.date_request && (
              <span className="flex items-center gap-1">
                <Calendar size={10} className="text-neon-blue/60" />
                Req {formatDateTime(os.date_request)}
              </span>
            )}
            {os.date_scheduled && (
              <span className="flex items-center gap-1 text-white/50">
                <Clock size={10} className="text-neon-blue/60" />
                Prog {formatDateTime(os.date_scheduled)}
              </span>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-0.5 text-xs text-white/60">
            {os.maintenance_type && (
              <span className="flex items-center gap-1">
                <Wrench size={10} className="text-neon-blue/60" />
                {MAINTENANCE_TYPE_LABEL[os.maintenance_type]}
              </span>
            )}
            {os.solicitante && (
              <span className="text-white/50 truncate">{os.solicitante}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {overdue && (
              <span className="overdue-glow inline-flex items-center gap-1 text-[10px] text-neon-pink font-medium whitespace-nowrap" title="Atrasada">
                <AlertCircle size={11} />
                Atrasada
              </span>
            )}
            {os.is_warranty && <ShieldCheck size={13} className="text-neon-green" />}
            <OsPriorityBadge priority={os.priority} compact />
            <OsStatusBadge state={os.state} />
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
