'use client'

import { useState } from 'react'
import { FileText, Plus, Clock, ClipboardList, Package, Activity, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { CollectionView, type ViewMode } from '@/components/ui/CollectionView'
import { useOsRelatorios, useOsParts, useEmployees, useOsChecklist } from '@/lib/hooks/useOs'
import {
  OS_RELATORIO_TYPE_LABEL,
  OS_RELATORIO_STATE_LABEL,
  OS_STATE_EQUIPMENT_LABEL,
  OS_TERMINAL_STATES,
  type OdooOs,
  type OsRelatorio,
  type OsRelatorioState,
  type OsRequestPart,
  type Employee,
  type OsChecklistItem,
} from '@/lib/types/os'
import { useOsPermissions } from '@/lib/hooks/useOsPermissions'
import { OsRelatorioModal } from './OsRelatorioModal'
import { OsRelatorioDetailModal } from './OsRelatorioDetailModal'
import { clsx } from 'clsx'

interface OsRelatoriosTabProps {
  os: OdooOs
}

export function OsRelatoriosTab({ os }: OsRelatoriosTabProps) {
  const { data: relatorios, isLoading, error } = useOsRelatorios(os.id)
  const { data: allParts } = useOsParts(os.id)
  const { data: employees } = useEmployees()
  const { data: checklistItems } = useOsChecklist(os.id)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<OsRelatorio | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<OsRelatorio | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const perms = useOsPermissions()

  const isTerminal = os.state && OS_TERMINAL_STATES.includes(os.state as never)

  const openAdd = () => { setEditing(null); setEditOpen(true) }
  const openEdit = (r: OsRelatorio) => {
    setDetailOpen(false)
    setEditing(r)
    setEditOpen(true)
  }
  const closeEdit = () => { setEditOpen(false); setEditing(null) }

  const openDetail = (r: OsRelatorio) => {
    setLoadingId(r.id)
    // simula pequeno delay visual para feedback — real: abre modal imediato
    setDetail(r)
    setDetailOpen(true)
    setTimeout(() => setLoadingId(null), 150)
  }
  const closeDetail = () => { setDetailOpen(false); setDetail(null) }

  return (
    <GlassCard className="p-5">
      <CollectionView
        items={relatorios}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        getKey={(r) => r.id}
        title="Relatórios de Serviço"
        icon={<FileText size={14} className="text-neon-blue" />}
        isLoading={isLoading}
        error={error}
        emptyIcon={<FileText size={28} />}
        emptyMessage="Nenhum relatório criado"
        onItemClick={openDetail}
        loadingId={loadingId}
        actions={
          !isTerminal && perms.canCreateRelatorios ? (
            <AnimatedButton variant="ghost" icon={<Plus size={12} />} onClick={openAdd}>
              Novo Relatório
            </AnimatedButton>
          ) : undefined
        }
        renderCard={(r, { onClick }) => (
          <RelatorioCard
            relatorio={r}
            onClick={onClick}
            parts={allParts || []}
            employees={employees || []}
            checklistItems={checklistItems || []}
          />
        )}
        renderRow={(r, { onClick }) => <RelatorioRow relatorio={r} onClick={onClick} />}
      />

      <OsRelatorioModal
        open={editOpen}
        onClose={closeEdit}
        osId={os.id}
        editing={editing}
        os={os}
      />

      <OsRelatorioDetailModal
        open={detailOpen}
        onClose={closeDetail}
        relatorio={detail}
        onEdit={() => detail && openEdit(detail)}
      />
    </GlassCard>
  )
}

function RelatorioCard({
  relatorio, onClick, parts, employees, checklistItems,
}: {
  relatorio: OsRelatorio
  onClick: () => void
  parts: OsRequestPart[]
  employees: Employee[]
  checklistItems: OsChecklistItem[]
}) {
  const hours =
    relatorio.time_execution !== false && relatorio.time_execution
      ? Number(relatorio.time_execution).toFixed(1) + 'h'
      : null

  // Checklist: incluídos neste relatório → conta done/pending
  const includedIds = new Set(relatorio.checklist_item_ids || [])
  const myItems = checklistItems.filter((it) => includedIds.has(it.id))
  const checklistTotal = myItems.length
  const checklistDone = myItems.filter((it) => it.check).length
  const checklistPending = checklistTotal - checklistDone

  // Peças: vinculadas a este relatório (request OU application)
  const myParts = parts.filter(
    (p) =>
      (p.relatorio_request_id && p.relatorio_request_id[0] === relatorio.id) ||
      (p.relatorio_application_id && p.relatorio_application_id[0] === relatorio.id)
  )
  const byState = {
    requisitada: myParts.filter((p) => p.state === 'requisitada').length,
    autorizada: myParts.filter((p) => p.state === 'autorizada').length,
    aplicada: myParts.filter((p) => p.state === 'aplicada').length,
    nao_autorizada: myParts.filter((p) => p.state === 'nao_autorizada').length,
    cancel: myParts.filter((p) => p.state === 'cancel').length,
  }
  const partsTotal = myParts.length

  const techs = (relatorio.technicians || [])
    .map((id) => employees.find((e) => e.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{relatorio.name}</p>
          {relatorio.report_type && (
            <p className="text-[10px] text-white/50 mt-0.5">
              {OS_RELATORIO_TYPE_LABEL[relatorio.report_type]}
            </p>
          )}
        </div>
        <StateBadge state={relatorio.state} />
      </div>

      {/* Estatísticas */}
      <div className="space-y-2">
        {/* Checklist */}
        <div className="rounded-lg bg-neon-blue/5 border border-neon-blue/15 p-2">
          <div className="flex items-center gap-2 mb-1.5">
            <ClipboardList size={11} className="text-neon-blue" />
            <p className="text-[9px] uppercase tracking-wide text-white/50 flex-1">Check-list</p>
            <p className="text-[10px] text-white/60 font-mono">{checklistTotal}</p>
          </div>
          {checklistTotal > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {checklistDone > 0 && (
                <Chip color="green" label={`${checklistDone} concluído${checklistDone === 1 ? '' : 's'}`} />
              )}
              {checklistPending > 0 && (
                <Chip color="orange" label={`${checklistPending} a fazer`} />
              )}
            </div>
          ) : (
            <p className="text-[10px] text-white/30">sem itens</p>
          )}
        </div>

        {/* Peças */}
        <div className="rounded-lg bg-neon-purple/5 border border-neon-purple/15 p-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Package size={11} className="text-neon-purple" />
            <p className="text-[9px] uppercase tracking-wide text-white/50 flex-1">Peças</p>
            <p className="text-[10px] text-white/60 font-mono">{partsTotal}</p>
          </div>
          {partsTotal > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {byState.requisitada > 0 && <Chip color="blue" label={`${byState.requisitada} requisit.`} />}
              {byState.autorizada > 0 && <Chip color="green" label={`${byState.autorizada} autoriz.`} />}
              {byState.aplicada > 0 && <Chip color="white" label={`${byState.aplicada} aplicada${byState.aplicada === 1 ? '' : 's'}`} />}
              {byState.nao_autorizada > 0 && <Chip color="pink" label={`${byState.nao_autorizada} não autoriz.`} />}
              {byState.cancel > 0 && <Chip color="pink" label={`${byState.cancel} cancel.`} />}
            </div>
          ) : (
            <p className="text-[10px] text-white/30">sem peças</p>
          )}
        </div>
      </div>

      {/* Estado do Equipamento */}
      {relatorio.state_equipment && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
          <Activity size={11} className={clsx(
            'flex-shrink-0',
            relatorio.state_equipment === 'funcionando' && 'text-neon-green',
            relatorio.state_equipment === 'parado' && 'text-neon-pink',
            relatorio.state_equipment === 'restricao' && 'text-neon-orange'
          )} />
          <span className="text-[11px] text-white/70 font-medium">
            {OS_STATE_EQUIPMENT_LABEL[relatorio.state_equipment]}
          </span>
        </div>
      )}

      {/* Técnicos */}
      {techs.length > 0 && (
        <div className="flex items-start gap-1.5">
          <User size={11} className="text-neon-blue/70 flex-shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1 min-w-0">
            {techs.slice(0, 3).map((name) => (
              <span
                key={name}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-neon-blue/10 text-neon-blue border border-neon-blue/20 truncate max-w-[120px]"
              >
                {name}
              </span>
            ))}
            {techs.length > 3 && (
              <span className="text-[10px] text-white/40">+{techs.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Footer — data + tempo */}
      <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5 mt-auto">
        {relatorio.data_atendimento ? (
          <span>{fmtDT(relatorio.data_atendimento)}</span>
        ) : (
          <span>—</span>
        )}
        {hours && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {hours}
          </span>
        )}
      </div>
    </div>
  )
}

function Chip({ color, label }: { color: 'blue' | 'green' | 'orange' | 'pink' | 'white'; label: string }) {
  const cls: Record<string, string> = {
    blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/25',
    green: 'bg-neon-green/10 text-neon-green border-neon-green/25',
    orange: 'bg-neon-orange/10 text-neon-orange border-neon-orange/25',
    pink: 'bg-neon-pink/10 text-neon-pink border-neon-pink/25',
    white: 'bg-white/5 text-white/60 border-white/15',
  }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-md border font-medium whitespace-nowrap', cls[color])}>
      {label}
    </span>
  )
}

function RelatorioRow({ relatorio, onClick }: { relatorio: OsRelatorio; onClick: () => void }) {
  const hours =
    relatorio.time_execution !== false && relatorio.time_execution
      ? Number(relatorio.time_execution).toFixed(1) + 'h'
      : null

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
        <FileText size={13} className="text-neon-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{relatorio.name}</span>
          <StateBadge state={relatorio.state} />
          {relatorio.report_type && (
            <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-md">
              {OS_RELATORIO_TYPE_LABEL[relatorio.report_type]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
          {relatorio.data_atendimento && <span>{fmtDT(relatorio.data_atendimento)}</span>}
          {hours && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {hours}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: OsRelatorioState }) {
  const colors: Record<OsRelatorioState, string> = {
    draft: 'text-neon-blue bg-neon-blue/10 border-neon-blue/20',
    done: 'text-neon-green bg-neon-green/10 border-neon-green/20',
    cancel: 'text-white/50 bg-white/5 border-white/15',
  }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', colors[state])}>
      {OS_RELATORIO_STATE_LABEL[state]}
    </span>
  )
}

function fmtDT(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
