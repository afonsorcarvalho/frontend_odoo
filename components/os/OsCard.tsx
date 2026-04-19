'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Wrench, AlertCircle, ExternalLink, ShieldCheck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { GlassCard } from '@/components/ui/GlassCard'
import { OsStatusBadge } from './OsStatusBadge'
import { OsPriorityBadge } from './OsPriorityBadge'
import {
  MAINTENANCE_TYPE_LABEL,
  type OdooOsSummary,
  isOsOverdue,
} from '@/lib/types/os'

interface OsCardProps {
  os: OdooOsSummary
  index?: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 260, damping: 20 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export function OsCard({ os, index = 0 }: OsCardProps) {
  const router = useRouter()
  const overdue = isOsOverdue(os)

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" custom={index} layout>
      <GlassCard
        variant="hover"
        noPadding
        className={clsx(
          'cursor-pointer group relative p-5 h-full',
          overdue && 'overdue-card-glow'
        )}
        onClick={() => router.push(`/os/${os.id}`)}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {os.name}
            </h3>
            {os.equipment_id && (
              <p className="text-xs text-white/50 mt-1 truncate flex items-center gap-1">
                <Wrench size={10} className="text-neon-blue/70" />
                {os.equipment_apelido
                  ? `${os.equipment_apelido} · ${os.equipment_id[1]}`
                  : os.equipment_id[1]}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <OsStatusBadge state={os.state} />
            <OsPriorityBadge priority={os.priority} compact />
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

        <div className="space-y-1.5">
          {os.maintenance_type && (
            <InfoRow
              icon={<Wrench size={11} />}
              label="Tipo"
              value={MAINTENANCE_TYPE_LABEL[os.maintenance_type]}
            />
          )}
          {os.date_request && (
            <InfoRow icon={<Calendar size={11} />} label="Requisição" value={formatDateTime(os.date_request)} />
          )}
          {os.date_scheduled && (
            <InfoRow icon={<Clock size={11} />} label="Programada" value={formatDateTime(os.date_scheduled)} />
          )}
          {os.tecnico_id && (
            <InfoRow icon={<User size={11} />} label="Técnico" value={os.tecnico_id[1]} />
          )}
          {os.solicitante && (
            <InfoRow icon={<User size={11} />} label="Solicitante" value={os.solicitante} />
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          {overdue && (
            <span className="overdue-glow inline-flex items-center gap-1 text-[10px] text-neon-pink font-medium">
              <AlertCircle size={10} /> Atrasada
            </span>
          )}
          {os.is_warranty && (
            <span className="inline-flex items-center gap-1 text-[10px] text-neon-green font-medium">
              <ShieldCheck size={10} /> Garantia
            </span>
          )}
          {os.who_executor && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/50 ml-auto">
              {os.who_executor === 'own' ? 'Própria' : 'Terceirizada'}
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
      <span className="text-white/40 w-20 flex-shrink-0">{label}</span>
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
