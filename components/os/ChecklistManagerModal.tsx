'use client'

import { useEffect, useState, useMemo } from 'react'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { X, ClipboardList, CheckSquare, Square, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { useToggleChecklistItem } from '@/lib/hooks/useOs'
import { type OsChecklistItem } from '@/lib/types/os'

interface ChecklistManagerModalProps {
  open: boolean
  onClose: () => void
  osId: number
  items: OsChecklistItem[]
  included: number[]
  onChange: (ids: number[]) => void
  /** ID do relatorio atual, se em edição. Se new, undefined */
  currentRelatorioId?: number
}

export function ChecklistManagerModal({
  open, onClose, osId, items, included, onChange, currentRelatorioId,
}: ChecklistManagerModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEscapeKey(open, onClose)

  // Filtra items disponíveis:
  // - inclui items já selecionados (sempre visíveis)
  // - inclui items deste relatório (para verificação)
  // - inclui items não marcados E sem relatório vinculado (disponíveis para seleção)
  // - exclui items concluídos por outro relatório
  const availableItems = useMemo(() => {
    return items.filter((it) => {
      if (included.includes(it.id)) return true
      if (currentRelatorioId && it.relatorio_id && it.relatorio_id[0] === currentRelatorioId) return true
      // Concluído por outro relatório → esconde
      if (it.check && it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
      // Vinculado a outro relatório (mesmo não concluído) → esconde
      if (it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
      return true
    })
  }, [items, included, currentRelatorioId])

  // Agrupar por secção
  const groups = useMemo(() => {
    const map = new Map<string, OsChecklistItem[]>()
    for (const it of availableItems) {
      const key = it.section ? it.section[1] : 'Sem seção'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return Array.from(map.entries()).map(([name, its]) => ({ name, items: its }))
  }, [availableItems])

  const [activeTab, setActiveTab] = useState<string>('')
  const [showExcluded, setShowExcluded] = useState(false)

  // Apenas items incluídos (para as tabs principais de verificação)
  const includedGroups = useMemo(() => {
    const inc = availableItems.filter((it) => included.includes(it.id))
    const map = new Map<string, OsChecklistItem[]>()
    for (const it of inc) {
      const key = it.section ? it.section[1] : 'Sem seção'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return Array.from(map.entries()).map(([name, its]) => ({ name, items: its }))
  }, [availableItems, included])

  const excludedItems = useMemo(
    () => availableItems.filter((it) => !included.includes(it.id)),
    [availableItems, included]
  )

  useEffect(() => {
    if (open && includedGroups.length > 0 && !includedGroups.find((g) => g.name === activeTab)) {
      setActiveTab(includedGroups[0].name)
    }
  }, [open, includedGroups, activeTab])

  useEffect(() => {
    if (!open) setShowExcluded(false)
  }, [open])

  const removeFromReport = (id: number) => onChange(included.filter((x) => x !== id))
  const addToReport = (id: number) => onChange([...included, id])
  const addAllToReport = () => onChange(availableItems.map((i) => i.id))

  const activeGroup = includedGroups.find((g) => g.name === activeTab)

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
            className="w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            <GlassCard className="p-5 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {showExcluded && (
                    <button
                      type="button"
                      onClick={() => setShowExcluded(false)}
                      className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      title="Voltar"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  <ClipboardList size={16} className="text-neon-blue" />
                  <h2 className="text-base font-semibold text-white">
                    {showExcluded ? 'Tarefas excluídas' : 'Itens do Check-list'}
                  </h2>
                  <span className="text-[11px] text-white/40 font-mono ml-2">
                    {showExcluded
                      ? `${excludedItems.length} ${excludedItems.length === 1 ? 'tarefa' : 'tarefas'}`
                      : `${included.length}/${availableItems.length} incluídos`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!showExcluded && excludedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowExcluded(true)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-neon-orange/10 text-neon-orange border border-neon-orange/30 hover:bg-neon-orange/20 transition-all"
                    >
                      <Trash2 size={11} />
                      Excluídas ({excludedItems.length})
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {showExcluded ? (
                <ExcludedPanel
                  items={excludedItems}
                  onAdd={addToReport}
                  onAddAll={() => {
                    addAllToReport()
                    setShowExcluded(false)
                  }}
                />
              ) : (
                <>
                  {/* Tab list */}
                  {includedGroups.length > 0 && (
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto mb-4 flex-shrink-0">
                      {includedGroups.map((g) => {
                        const total = g.items.length
                        const done = g.items.filter((i) => i.check).length
                        const active = activeTab === g.name
                        return (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => setActiveTab(g.name)}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                              active
                                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            )}
                          >
                            <span>{g.name}</span>
                            <span className="text-[10px] text-white/40 font-mono">
                              {done}/{total}
                            </span>
                            {done > 0 && done === total && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                                ✓
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Tab panel */}
                  <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                    {activeGroup ? (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeGroup.name}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-1.5"
                        >
                          {activeGroup.items.map((item) => (
                            <ChecklistRow
                              key={item.id}
                              item={item}
                              osId={osId}
                              onRemove={() => removeFromReport(item.id)}
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="py-10 text-center text-white/30 text-sm">
                        Nenhum item incluído neste relatório.
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10 flex-shrink-0">
                <AnimatedButton variant="neon" onClick={onClose}>Concluído</AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

function ChecklistRow({
  item,
  osId,
  onRemove,
}: {
  item: OsChecklistItem
  osId: number
  onRemove: () => void
}) {
  const toggle = useToggleChecklistItem(osId)
  const [localMedicao, setLocalMedicao] = useState<string>(
    item.medicao !== false && item.medicao !== null ? String(item.medicao) : ''
  )
  const [localObs, setLocalObs] = useState<string>(
    typeof item.observations === 'string' ? item.observations : ''
  )

  useEffect(() => {
    setLocalMedicao(item.medicao !== false && item.medicao !== null ? String(item.medicao) : '')
  }, [item.medicao])
  useEffect(() => {
    setLocalObs(typeof item.observations === 'string' ? item.observations : '')
  }, [item.observations])

  const handleMedicaoBlur = () => {
    const val = parseFloat(localMedicao)
    if (!isNaN(val) && val !== item.medicao) {
      toggle.mutate({ id: item.id, vals: { medicao: val, check: true } })
    }
  }

  const handleObsBlur = () => {
    const current = typeof item.observations === 'string' ? item.observations : ''
    if (localObs !== current) {
      toggle.mutate({ id: item.id, vals: { observations: localObs } })
    }
  }

  return (
    <div
      className={clsx(
        'p-2.5 rounded-xl border transition-colors',
        item.check
          ? 'bg-neon-green/5 border-neon-green/15'
          : 'bg-white/[0.02] border-white/5'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Check de concluído (esquerda, perto do nome) */}
        <button
          type="button"
          onClick={() => toggle.mutate({ id: item.id, vals: { check: !item.check } })}
          disabled={toggle.isPending}
          className={clsx(
            'flex-shrink-0 mt-0.5 transition-colors',
            item.check ? 'text-neon-green' : 'text-white/30 hover:text-neon-green'
          )}
          title={item.check ? 'Desmarcar concluído' : 'Marcar como concluído'}
        >
          {item.check ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={clsx('text-xs', item.check ? 'text-white/60 line-through' : 'text-white/90')}>
            {item.instruction || '—'}
          </p>
        </div>

        {item.tem_medicao && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number"
              step="any"
              value={localMedicao}
              onChange={(e) => setLocalMedicao(e.target.value)}
              onBlur={handleMedicaoBlur}
              placeholder="0"
              className="w-20 px-2 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-white text-right focus:outline-none focus:border-neon-blue/40"
            />
            {item.magnitude && (
              <span className="text-[9px] text-white/40 uppercase">{item.magnitude}</span>
            )}
          </div>
        )}

        {/* Lixeira (direita) — exclui do relatório */}
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 mt-0.5 p-0.5 rounded-md text-white/30 hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
          title="Excluir do relatório"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 pl-[28px]">
        <input
          type="text"
          value={localObs}
          onChange={(e) => setLocalObs(e.target.value)}
          onBlur={handleObsBlur}
          placeholder="Observações..."
          className="w-full px-2 py-1 rounded-md text-[11px] bg-white/[0.03] border border-white/5 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-neon-blue/30 focus:bg-white/[0.05]"
        />
      </div>
    </div>
  )
}

function ExcludedPanel({
  items, onAdd, onAddAll,
}: {
  items: OsChecklistItem[]
  onAdd: (id: number) => void
  onAddAll: () => void
}) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-white/30 text-sm">
        Nenhuma tarefa excluída.
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl bg-neon-orange/5 border border-neon-orange/15">
        <p className="text-xs text-white/70">
          {items.length} tarefa{items.length === 1 ? '' : 's'} excluída{items.length === 1 ? '' : 's'} do relatório
        </p>
        <button
          type="button"
          onClick={onAddAll}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-all"
        >
          <Plus size={11} />
          Adicionar todos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/90 truncate">{item.instruction || '—'}</p>
              {item.section && (
                <p className="text-[10px] text-white/40 mt-0.5">{item.section[1]}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onAdd(item.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-all"
            >
              <Plus size={11} />
              Adicionar ao relatório
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
