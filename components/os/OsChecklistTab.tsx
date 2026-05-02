'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ClipboardList, Loader2, CheckSquare, Square, Wand2, AlertCircle, Info, FileText } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ActionButton } from '@/components/ui/ActionButton'
import { useOsChecklist, useGenerateChecklist } from '@/lib/hooks/useOs'
import { useOsPermissions } from '@/lib/hooks/useOsPermissions'
import { OS_TERMINAL_STATES, type OdooOs, type OsChecklistItem } from '@/lib/types/os'
import { clsx } from 'clsx'

const CHECKLIST_TYPES: Array<'preventive' | 'loan' | 'calibration'> = ['preventive', 'loan', 'calibration']

interface OsChecklistTabProps {
  os: OdooOs
}

export function OsChecklistTab({ os }: OsChecklistTabProps) {
  const { data: items, isLoading, error } = useOsChecklist(os.id)
  const generateMutation = useGenerateChecklist(os.id)
  const { canWriteOs } = useOsPermissions()

  const isTerminal = os.state && OS_TERMINAL_STATES.includes(os.state as never)
  const canGenerate =
    canWriteOs &&
    !os.check_list_created &&
    os.maintenance_type &&
    CHECKLIST_TYPES.includes(os.maintenance_type as never)

  const done = items ? items.filter((i) => i.check).length : 0
  const total = items ? items.length : 0

  // Group by section
  const groups = items ? groupBySection(items) : []

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-neon-blue" />
          <h3 className="text-sm font-semibold text-white">Check-list</h3>
          {total > 0 && (
            <span className="text-[10px] text-white/40 font-mono">
              {done}/{total} concluídos
            </span>
          )}
        </div>
        {!os.check_list_created && canGenerate && !isTerminal && (
          <ActionButton
            icon={<Wand2 size={12} />}
            pending={generateMutation.isPending}
            loadingText="Gerando..."
            onAction={() => generateMutation.mutate()}
          >
            Gerar Checklist
          </ActionButton>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-white/40 text-sm">
          <Loader2 size={14} className="animate-spin text-neon-blue" />
          Carregando checklist...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-10 text-neon-pink text-sm">
          <AlertCircle size={14} />
          Erro ao carregar checklist
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-white/30">
          <ClipboardList size={28} />
          <span className="text-xs">
            {canGenerate
              ? 'Nenhum item gerado ainda. Clique em "Gerar Checklist".'
              : 'Nenhum item no checklist.'}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
            <Info size={14} className="text-neon-blue flex-shrink-0 mt-0.5" />
            <div className="text-xs text-white/70 leading-relaxed">
              Os itens do check-list <strong>não podem ser modificados diretamente aqui</strong>.
              Crie um <FileText size={11} className="inline text-neon-blue mx-0.5" />
              <strong>Relatório</strong> na aba correspondente, inclua os itens desejados e marque-os
              como concluídos no relatório.
            </div>
          </div>
          <div className="space-y-5">
            {groups.map(({ section, items: sectionItems }) => (
              <SectionGroup
                key={section}
                section={section}
                items={sectionItems}
              />
            ))}
          </div>
        </>
      )}
    </GlassCard>
  )
}

function SectionGroup({
  section,
  items,
}: {
  section: string
  items: OsChecklistItem[]
}) {
  return (
    <div>
      {section && (
        <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2 px-1">{section}</p>
      )}
      <div className="space-y-1">
        {items.map((item, i) => (
          <ChecklistRow key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}

function ChecklistRow({
  item,
  index,
}: {
  item: OsChecklistItem
  index: number
}) {
  const [localMedicao, setLocalMedicao] = useState<string>(
    item.medicao !== false && item.medicao !== null ? String(item.medicao) : ''
  )

  const blockEdit = () => {
    toast.error(
      'Itens do check-list são modificados via Relatório. Vá à aba Relatórios, crie/abra um relatório e inclua este item.',
      { duration: 5000 }
    )
  }

  const handleToggle = () => blockEdit()
  const handleMedicaoBlur = () => {
    if (localMedicao !== (item.medicao !== false && item.medicao !== null ? String(item.medicao) : '')) {
      blockEdit()
      setLocalMedicao(item.medicao !== false && item.medicao !== null ? String(item.medicao) : '')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, type: 'spring', stiffness: 400, damping: 28 }}
      className={clsx(
        'flex items-start gap-3 p-3 rounded-xl border transition-colors',
        item.check
          ? 'bg-neon-green/5 border-neon-green/15'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
      )}
    >
      <button
        onClick={handleToggle}
        className={clsx(
          'flex-shrink-0 mt-0.5 transition-colors cursor-help',
          item.check ? 'text-neon-green' : 'text-white/30'
        )}
        title="Modificado via Relatório"
        aria-label={item.check ? 'Concluído' : 'Pendente'}
      >
        {item.check ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm', item.check ? 'text-white/60 line-through' : 'text-white/90')}>
          {item.instruction || '—'}
        </p>
        {item.observations && (
          <p className="text-[11px] text-white/40 mt-0.5">{item.observations}</p>
        )}
      </div>

      {item.tem_medicao && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="number"
            step="any"
            value={localMedicao}
            onChange={(e) => setLocalMedicao(e.target.value)}
            onBlur={handleMedicaoBlur}
            placeholder="0"
            title="Modificado via Relatório"
            className="w-20 px-2 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-white text-right focus:outline-none focus:border-neon-blue/40 cursor-help"
          />
          {item.magnitude && (
            <span className="text-[10px] text-white/40 uppercase">{item.magnitude}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function groupBySection(items: OsChecklistItem[]): { section: string; items: OsChecklistItem[] }[] {
  const map = new Map<string, OsChecklistItem[]>()
  for (const item of items) {
    const key = item.section ? item.section[1] : ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([section, items]) => ({ section, items }))
}
