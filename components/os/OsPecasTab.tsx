'use client'

import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Package, Loader2, AlertCircle, Info, FileText } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useOsParts } from '@/lib/hooks/useOs'
import {
  OS_PART_STATE_LABEL,
  type OdooOs,
  type OsRequestPart,
  type OsPartState,
} from '@/lib/types/os'
import { clsx } from 'clsx'

interface OsPecasTabProps {
  os: OdooOs
}

export function OsPecasTab({ os }: OsPecasTabProps) {
  const { data: parts, isLoading, error } = useOsParts(os.id)

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-neon-blue" />
          <h3 className="text-sm font-semibold text-white">Peças</h3>
          {parts && (
            <span className="text-[10px] text-white/40 font-mono">
              {parts.length} {parts.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-white/40 text-sm">
          <Loader2 size={14} className="animate-spin text-neon-blue" />
          Carregando peças...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-10 text-neon-pink text-sm">
          <AlertCircle size={14} />
          Erro ao carregar peças
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
            <Info size={14} className="text-neon-blue flex-shrink-0 mt-0.5" />
            <div className="text-xs text-white/70 leading-relaxed">
              Solicitação e aplicação de peças são feitas <strong>via Relatório</strong>.
              Acesse a aba <FileText size={11} className="inline text-neon-blue mx-0.5" />
              <strong>Relatórios</strong>, crie ou abra um relatório e solicite/aplique as peças dentro dele.
            </div>
          </div>

          {!parts || parts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-white/30">
              <Package size={28} />
              <span className="text-xs">Nenhuma peça solicitada</span>
            </div>
          ) : (
            <div className="space-y-2">
              {parts.map((p, i) => (
                <PartRow key={p.id} part={p} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </GlassCard>
  )
}

function PartRow({
  part,
  index,
}: {
  part: OsRequestPart
  index: number
}) {
  const blockEdit = () => {
    toast.error(
      'Solicitação/aplicação de peças é feita via Relatório. Abra um relatório na aba Relatórios.',
      { duration: 5000 }
    )
  }

  const qty =
    typeof part.product_uom_qty === 'number'
      ? Number.isInteger(part.product_uom_qty)
        ? part.product_uom_qty
        : part.product_uom_qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
      : 0

  const uom = part.product_uom ? part.product_uom[1] : ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
        <Package size={13} className="text-neon-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{part.product_id[1]}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <PartStateBadge state={part.state} />
          {part.relatorio_request_id && (
            <span className="text-[10px] text-white/30 truncate">
              {part.relatorio_request_id[1]}
            </span>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white tabular-nums">{qty}</p>
        {uom && <p className="text-[10px] text-white/40 uppercase">{uom}</p>}
      </div>

      <button
        onClick={blockEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40 hover:text-neon-blue px-2 py-1 rounded-md hover:bg-neon-blue/10"
        title="Modificado via Relatório"
      >
        via Relatório
      </button>
    </motion.div>
  )
}

function PartStateBadge({ state }: { state: OsPartState }) {
  const colors: Record<OsPartState, string> = {
    requisitada: 'text-neon-blue bg-neon-blue/10 border-neon-blue/20',
    autorizada: 'text-neon-green bg-neon-green/10 border-neon-green/20',
    aplicada: 'text-white/50 bg-white/5 border-white/10',
    nao_autorizada: 'text-neon-pink bg-neon-pink/10 border-neon-pink/20',
    cancel: 'text-neon-pink/60 bg-neon-pink/5 border-neon-pink/10',
  }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', colors[state])}>
      {OS_PART_STATE_LABEL[state]}
    </span>
  )
}
