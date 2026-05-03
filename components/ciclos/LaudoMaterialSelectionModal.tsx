'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Factory, PackageX, Loader2, Hash } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { useCycleMaterials } from '@/lib/hooks/useCiclos'
import { CYCLE_MATERIAL_UNIT_LABEL, type OdooCycleMaterial } from '@/lib/types/ciclo'

interface LaudoMaterialSelectionModalProps {
  open: boolean
  onClose: () => void
  cycleId: number
  cycleName?: string
  onConfirm: (materialIds: number[]) => void
}

interface Group {
  key: string
  label: string
  materials: OdooCycleMaterial[]
}

const NO_FAB_KEY = '__none__'

function buildGroups(materials: OdooCycleMaterial[]): Group[] {
  const map = new Map<string, Group>()
  for (const m of materials) {
    const id = m.fabricante_id ? m.fabricante_id[0] : null
    const label =
      (m.fabricante_nome && String(m.fabricante_nome)) ||
      (m.fabricante_id ? m.fabricante_id[1] : 'Sem fabricante')
    const key = id !== null ? `f:${id}` : NO_FAB_KEY
    if (!map.has(key)) map.set(key, { key, label, materials: [] })
    map.get(key)!.materials.push(m)
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function LaudoMaterialSelectionModal({
  open,
  onClose,
  cycleId,
  cycleName,
  onConfirm,
}: LaudoMaterialSelectionModalProps) {
  const { data: materials, isLoading, error } = useCycleMaterials(open ? cycleId : null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open && materials) {
      setSelected(new Set(materials.map((m) => m.id)))
    }
  }, [open, materials])

  const groups = useMemo(() => buildGroups(materials ?? []), [materials])
  const total = materials?.length ?? 0
  const count = selected.size

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (g: Group) => {
    const ids = g.materials.map((m) => m.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const selectAll = () => setSelected(new Set((materials ?? []).map((m) => m.id)))
  const selectNone = () => setSelected(new Set())

  const handleConfirm = () => {
    if (count === 0) return
    onConfirm(Array.from(selected))
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="laudo-sel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="laudo-sel-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto rounded-2xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />

              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="text-neon-blue flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-white font-semibold truncate">Selecionar materiais para o laudo</h2>
                    {cycleName && (
                      <p className="text-xs text-white/40 truncate">{cycleName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 px-6 py-3 border-b border-white/5 text-xs">
                <span className="text-white/50">
                  <span className="font-mono text-white/80">{count}</span> de{' '}
                  <span className="font-mono">{total}</span> selecionados
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    disabled={total === 0 || count === total}
                    className="px-2 py-1 rounded-lg text-[11px] text-neon-blue border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Todos
                  </button>
                  <button
                    onClick={selectNone}
                    disabled={count === 0}
                    className="px-2 py-1 rounded-lg text-[11px] text-white/60 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Nenhum
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-white/40 text-sm">
                    <Loader2 size={14} className="animate-spin text-neon-blue" />
                    Carregando materiais...
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-neon-pink text-sm">Erro ao carregar materiais</div>
                ) : total === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-white/30">
                    <PackageX size={28} />
                    <span className="text-xs">Sem materiais para selecionar neste ciclo.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((g) => {
                      const ids = g.materials.map((m) => m.id)
                      const groupCount = ids.filter((id) => selected.has(id)).length
                      const allSelected = groupCount === ids.length
                      const someSelected = groupCount > 0 && !allSelected
                      return (
                        <div key={g.key} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleGroup(g)}
                            className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/[0.03] transition-colors"
                          >
                            <span
                              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                allSelected
                                  ? 'bg-neon-blue border-neon-blue'
                                  : someSelected
                                    ? 'bg-neon-blue/40 border-neon-blue/60'
                                    : 'bg-transparent border-white/30'
                              }`}
                            >
                              {(allSelected || someSelected) && (
                                <span className="text-[10px] text-white leading-none">
                                  {allSelected ? '✓' : '—'}
                                </span>
                              )}
                            </span>
                            <Factory size={12} className="text-white/40 flex-shrink-0" />
                            <span className="flex-1 text-left text-sm font-medium text-white truncate">{g.label}</span>
                            <span className="text-[10px] text-white/40 font-mono flex-shrink-0">
                              {groupCount}/{ids.length}
                            </span>
                          </button>
                          <ul className="divide-y divide-white/5">
                            {g.materials.map((m) => (
                              <MaterialRow
                                key={m.id}
                                material={m}
                                checked={selected.has(m.id)}
                                onToggle={() => toggle(m.id)}
                              />
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-6 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <AnimatedButton
                  onClick={handleConfirm}
                  disabled={count === 0}
                  variant="neon"
                >
                  <FileText size={14} />
                  Gerar laudo ({count})
                </AnimatedButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function MaterialRow({
  material,
  checked,
  onToggle,
}: {
  material: OdooCycleMaterial
  checked: boolean
  onToggle: () => void
}) {
  const name =
    (material.material_descricao && String(material.material_descricao)) ||
    (material.material_id ? material.material_id[1] : '—')
  const unidade = material.unidade ? CYCLE_MATERIAL_UNIT_LABEL[material.unidade] : ''
  const qtd = material.quantidade !== false && material.quantidade !== null ? material.quantidade : 0

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          checked ? 'bg-neon-blue/[0.05] hover:bg-neon-blue/10' : 'hover:bg-white/[0.03]'
        }`}
      >
        <span
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            checked ? 'bg-neon-blue border-neon-blue' : 'bg-transparent border-white/30'
          }`}
        >
          {checked && <span className="text-[10px] text-white leading-none">{'✓'}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{name}</p>
          {material.lote && (
            <p className="text-[11px] text-white/40 font-mono flex items-center gap-1 mt-0.5">
              <Hash size={9} className="text-white/30" />
              {material.lote}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-white tabular-nums">
            {Number.isInteger(qtd) ? qtd : Number(qtd).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
          </div>
          {unidade && <div className="text-[10px] text-white/40 uppercase tracking-wider">{unidade}</div>}
        </div>
      </button>
    </li>
  )
}
