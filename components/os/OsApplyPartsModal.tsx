'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { ActionButton } from '@/components/ui/ActionButton'
import { useOsParts, useApplyPart } from '@/lib/hooks/useOs'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { OS_PART_STATE_LABEL, type OsPartState } from '@/lib/types/os'

interface OsApplyPartsModalProps {
  open: boolean
  onClose: () => void
  osId: number
  relatorioId: number
}

export function OsApplyPartsModal({ open, onClose, osId, relatorioId }: OsApplyPartsModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEscapeKey(open, onClose)

  const { data: allParts, isLoading } = useOsParts(osId)
  const applyMutation = useApplyPart(osId)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  // Disponíveis: state em requisitada/autorizada E sem relatorio_application_id
  const available = (allParts || []).filter(
    (p) =>
      (p.state === 'requisitada' || p.state === 'autorizada') &&
      !p.relatorio_application_id
  )

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleApply = async () => {
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => applyMutation.mutateAsync({ partId: id, relatorioId })))
    onClose()
  }

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            <GlassCard className="p-5 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-neon-green" />
                  <h2 className="text-base font-semibold text-white">Aplicar Peças</h2>
                  <span className="text-[11px] text-white/40 font-mono ml-2">
                    {selected.size}/{available.length} selecionadas
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-start gap-2 p-2.5 mb-3 rounded-xl bg-neon-blue/5 border border-neon-blue/20 text-xs text-white/70">
                <AlertCircle size={12} className="text-neon-blue flex-shrink-0 mt-0.5" />
                Selecione as peças já solicitadas na OS para aplicar neste relatório.
              </div>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                {isLoading ? (
                  <div className="py-10 text-center text-white/40 text-sm">Carregando...</div>
                ) : available.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-white/30">
                    <Package size={24} />
                    <span className="text-xs">Nenhuma peça disponível para aplicação</span>
                    <span className="text-[10px] text-white/20 text-center max-w-xs">
                      Só aparecem peças solicitadas na OS ainda não aplicadas
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {available.map((p) => {
                      const isSel = selected.has(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggle(p.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left',
                            isSel
                              ? 'bg-neon-green/10 border-neon-green/30 text-white'
                              : 'bg-white/[0.02] border-white/5 text-white/80 hover:bg-white/[0.05]'
                          )}
                        >
                          <div className={clsx(
                            'flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                            isSel
                              ? 'bg-neon-green border-neon-green text-dark-900'
                              : 'border-white/20'
                          )}>
                            {isSel && <CheckCircle2 size={12} />}
                          </div>
                          <Package size={13} className="text-neon-blue/70 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.product_id[1]}</p>
                            {p.relatorio_request_id && (
                              <p className="text-[10px] text-white/40 mt-0.5 truncate">
                                Solicitada em {p.relatorio_request_id[1]}
                              </p>
                            )}
                          </div>
                          <StateBadge state={p.state} />
                          <span className="text-xs text-white/70 tabular-nums flex-shrink-0 min-w-[60px] text-right">
                            {Number.isInteger(p.product_uom_qty) ? p.product_uom_qty : Number(p.product_uom_qty).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                            {p.product_uom && <span className="text-[9px] text-white/40 uppercase ml-1">{p.product_uom[1]}</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10">
                <AnimatedButton variant="ghost" onClick={onClose}>Cancelar</AnimatedButton>
                <ActionButton
                  variant="neon"
                  icon={<CheckCircle2 size={13} />}
                  onAction={handleApply}
                  pending={applyMutation.isPending}
                  loadingText="Aplicando..."
                  disabled={selected.size === 0}
                >
                  Aplicar {selected.size > 0 ? `(${selected.size})` : ''}
                </ActionButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

function StateBadge({ state }: { state: OsPartState }) {
  const colors: Record<OsPartState, string> = {
    requisitada: 'text-neon-blue bg-neon-blue/10 border-neon-blue/20',
    autorizada: 'text-neon-green bg-neon-green/10 border-neon-green/20',
    aplicada: 'text-white/60 bg-white/5 border-white/15',
    nao_autorizada: 'text-neon-pink bg-neon-pink/10 border-neon-pink/20',
    cancel: 'text-neon-pink/60 bg-neon-pink/5 border-neon-pink/10',
  }
  return (
    <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-md border font-medium flex-shrink-0', colors[state])}>
      {OS_PART_STATE_LABEL[state]}
    </span>
  )
}
