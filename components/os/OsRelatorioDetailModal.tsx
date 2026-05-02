'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, Clock, Calendar, User, Activity, AlertCircle, Pencil,
  CheckCircle2, XCircle, Trash2, ClipboardList, Package, Plus,
} from 'lucide-react'
import { clsx } from 'clsx'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { ActionButton } from '@/components/ui/ActionButton'
import { PrintMenu } from '@/components/ui/PrintMenu'
import { usePdfReport } from '@/lib/hooks/usePdfReport'

const PdfViewerModal = dynamic(
  () => import('@/components/ui/PdfViewerModal').then((m) => m.PdfViewerModal),
  { ssr: false }
)
import {
  useEmployees,
  useOsChecklist,
  useDeleteRelatorio,
  useDoneRelatorio,
  useCancelRelatorio,
  useOsParts,
  useUpdatePartState,
  useDeletePart,
} from '@/lib/hooks/useOs'
import { OsPartModal } from './OsPartModal'
import { OsApplyPartsModal } from './OsApplyPartsModal'
import { useOsPermissions } from '@/lib/hooks/useOsPermissions'
import {
  OS_RELATORIO_TYPE_LABEL,
  OS_RELATORIO_STATE_LABEL,
  OS_STATE_EQUIPMENT_LABEL,
  OS_PART_STATE_LABEL,
  type OsRelatorio,
  type OsRelatorioState,
  type OsRequestPart,
  type OsPartState,
} from '@/lib/types/os'

interface OsRelatorioDetailModalProps {
  open: boolean
  onClose: () => void
  relatorio: OsRelatorio | null
  onEdit: () => void
}

export function OsRelatorioDetailModal({ open, onClose, relatorio, onEdit }: OsRelatorioDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEscapeKey(open, onClose)

  const { data: employees } = useEmployees()
  const { data: checklistItems } = useOsChecklist(relatorio?.os_id?.[0] ?? null)
  const { data: allParts } = useOsParts(relatorio?.os_id?.[0] ?? null)
  const perms = useOsPermissions()

  const [partRequestModalOpen, setPartRequestModalOpen] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  const deleteMutation = useDeleteRelatorio(relatorio?.os_id?.[0] ?? 0)
  const doneMutation = useDoneRelatorio(relatorio?.os_id?.[0] ?? 0)
  const cancelMutation = useCancelRelatorio(relatorio?.os_id?.[0] ?? 0)

  const pdf = usePdfReport()
  const handleOpenReport = (reportName: string, label: string, pattern?: string) => {
    if (!relatorio) return
    const osId = relatorio.os_id?.[0]
    const osName = relatorio.os_id?.[1] || relatorio.name
    if (!osId) return
    return pdf.openReport(reportName, [osId], label, pattern, { id: osId, name: osName })
  }

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {open && relatorio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <GlassCard className="p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText size={18} className="text-neon-blue" />
                    <h2 className="text-lg font-semibold text-white">{relatorio.name}</h2>
                    <StateBadge state={relatorio.state} />
                    {relatorio.report_type && (
                      <span className="text-[10px] text-white/60 bg-white/5 px-1.5 py-0.5 rounded-md">
                        {OS_RELATORIO_TYPE_LABEL[relatorio.report_type]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">OS {relatorio.os_id?.[1]}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PrintMenu
                    model="engc.os"
                    onOpenReport={handleOpenReport}
                    size="sm"
                    filterReports={(r) =>
                      r.report_name !== 'engc_os.report_checklist_blank_template' ||
                      (checklistItems?.length ?? 0) > 0
                    }
                  />
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <InfoCard icon={<Calendar size={12} />} label="Início do atendimento" value={fmtDT(relatorio.data_atendimento)} />
                <InfoCard icon={<Calendar size={12} />} label="Fim do atendimento" value={fmtDT(relatorio.data_fim_atendimento)} />
                <InfoCard
                  icon={<Clock size={12} />}
                  label="Duração"
                  value={relatorio.time_execution ? `${Number(relatorio.time_execution).toFixed(1)}h` : '—'}
                />
                <InfoCard
                  icon={<Activity size={12} />}
                  label="Estado do equipamento"
                  value={relatorio.state_equipment ? OS_STATE_EQUIPMENT_LABEL[relatorio.state_equipment] : '—'}
                />
              </div>

              {relatorio.state_equipment === 'restricao' && relatorio.restriction_type && (
                <Section icon={<AlertCircle size={12} />} title="Restrição">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{relatorio.restriction_type}</p>
                </Section>
              )}

              <Section icon={<User size={12} />} title="Técnicos">
                <div className="flex flex-wrap gap-1.5">
                  {relatorio.technicians && relatorio.technicians.length > 0 ? (
                    relatorio.technicians.map((tid) => {
                      const e = employees?.find((x) => x.id === tid)
                      return (
                        <span
                          key={tid}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-neon-blue/10 border border-neon-blue/30 text-neon-blue"
                        >
                          <User size={10} />
                          {e?.name || `#${tid}`}
                        </span>
                      )
                    })
                  ) : (
                    <span className="text-xs text-white/40">—</span>
                  )}
                </div>
              </Section>

              <Section title="Descrição da falha">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{relatorio.fault_description || '—'}</p>
              </Section>

              <Section title="Resumo do serviço">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{relatorio.service_summary || '—'}</p>
              </Section>

              {relatorio.observations && (
                <Section title="Observações">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{relatorio.observations}</p>
                </Section>
              )}

              {relatorio.pendency && (
                <Section title="Pendências">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{relatorio.pendency}</p>
                </Section>
              )}

              {checklistItems && relatorio.checklist_item_ids && relatorio.checklist_item_ids.length > 0 && (
                <Section icon={<ClipboardList size={12} />} title={`Itens do Check-list (${relatorio.checklist_item_ids.length})`}>
                  <div className="space-y-1">
                    {checklistItems
                      .filter((ci) => relatorio.checklist_item_ids.includes(ci.id))
                      .map((ci) => (
                        <div
                          key={ci.id}
                          className={clsx(
                            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
                            ci.check ? 'bg-neon-green/5 text-white/60' : 'bg-white/[0.02] text-white/80'
                          )}
                        >
                          <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', ci.check ? 'bg-neon-green' : 'bg-white/20')} />
                          <span className={clsx('flex-1 truncate', ci.check && 'line-through')}>
                            {ci.instruction || '—'}
                          </span>
                          {ci.tem_medicao && ci.medicao !== false && (
                            <span className="text-white/50 tabular-nums flex-shrink-0">
                              {ci.medicao}{ci.magnitude && ` ${ci.magnitude}`}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </Section>
              )}

              {(() => {
                const linked = (allParts || []).filter(
                  (p) =>
                    (p.relatorio_request_id && p.relatorio_request_id[0] === relatorio.id) ||
                    (p.relatorio_application_id && p.relatorio_application_id[0] === relatorio.id)
                )
                const requestedCount = linked.filter(
                  (p) => p.relatorio_request_id && p.relatorio_request_id[0] === relatorio.id
                ).length
                const appliedCount = linked.filter(
                  (p) => p.relatorio_application_id && p.relatorio_application_id[0] === relatorio.id
                ).length
                const isDraft = relatorio.state === 'draft'
                const canEdit = isDraft && perms.canWriteRelatorios
                return (
                  <div className="mb-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-neon-blue" />
                        <h4 className="text-sm font-semibold text-white">Peças</h4>
                        <span className="text-[10px] text-white/40 font-mono ml-1">
                          {requestedCount} solic. · {appliedCount} aplic.
                        </span>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPartRequestModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-all"
                          >
                            <Plus size={11} /> Solicitar
                          </button>
                          <button
                            type="button"
                            onClick={() => setApplyModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 transition-all"
                          >
                            <CheckCircle2 size={11} /> Aplicar
                          </button>
                        </div>
                      )}
                    </div>

                    {linked.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6 text-white/30">
                        <Package size={22} />
                        <span className="text-xs">Nenhuma peça vinculada</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {linked.map((p) => (
                          <PartRowMini
                            key={p.id}
                            part={p}
                            osId={relatorio.os_id[0]}
                            canEdit={canEdit}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10 flex-wrap">
                {relatorio.state === 'draft' && perms.canWriteRelatorios && (
                  <>
                    <ActionButton
                      icon={<CheckCircle2 size={13} />}
                      pending={doneMutation.isPending}
                      loadingText="Concluindo..."
                      onAction={() => doneMutation.mutate(relatorio.id, { onSuccess: onClose })}
                    >
                      Concluir
                    </ActionButton>
                    <ActionButton
                      icon={<XCircle size={13} />}
                      pending={cancelMutation.isPending}
                      loadingText="Cancelando..."
                      onAction={() => cancelMutation.mutate(relatorio.id, { onSuccess: onClose })}
                    >
                      Cancelar
                    </ActionButton>
                  </>
                )}
                {relatorio.state === 'draft' && perms.canUnlinkRelatorios && (
                  <ActionButton
                    icon={<Trash2 size={13} />}
                    pending={deleteMutation.isPending}
                    loadingText="Removendo..."
                    onAction={() => {
                      if (confirm(`Remover ${relatorio.name}?`)) {
                        deleteMutation.mutate(relatorio.id, { onSuccess: onClose })
                      }
                    }}
                  >
                    Apagar
                  </ActionButton>
                )}
                <AnimatedButton variant="ghost" onClick={onClose}>Fechar</AnimatedButton>
                {relatorio.state === 'draft' && perms.canWriteRelatorios && (
                  <ActionButton variant="neon" icon={<Pencil size={13} />} onAction={onEdit}>
                    Editar
                  </ActionButton>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {createPortal(content, document.body)}
      <PdfViewerModal
        open={pdf.pdfOpen}
        onOpenChange={pdf.setPdfOpen}
        file={pdf.pdfBlob}
        isLoading={pdf.pdfLoading}
        title={pdf.pdfTitle}
        filename={pdf.pdfServerFilename ?? pdf.pdfFallback}
      />
      {relatorio && (
        <>
          <OsPartModal
            open={partRequestModalOpen}
            onClose={() => setPartRequestModalOpen(false)}
            osId={relatorio.os_id[0]}
            relatorioId={relatorio.id}
          />
          <OsApplyPartsModal
            open={applyModalOpen}
            onClose={() => setApplyModalOpen(false)}
            osId={relatorio.os_id[0]}
            relatorioId={relatorio.id}
          />
        </>
      )}
    </>
  )
}

function PartRowMini({
  part, osId, canEdit,
}: {
  part: OsRequestPart
  osId: number
  canEdit: boolean
}) {
  const updateState = useUpdatePartState(osId)
  const deletePart = useDeletePart(osId)

  const qty =
    typeof part.product_uom_qty === 'number'
      ? Number.isInteger(part.product_uom_qty)
        ? part.product_uom_qty
        : part.product_uom_qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
      : 0
  const uom = part.product_uom ? part.product_uom[1] : ''

  const handleDelete = () => {
    if (confirm(`Remover "${part.product_id[1]}"?`)) {
      deletePart.mutate(part.id)
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 group">
      <Package size={11} className="text-neon-blue/70 flex-shrink-0" />
      <span className="text-xs text-white/90 truncate flex-1">{part.product_id[1]}</span>
      <MiniStateBadge state={part.state} />
      <span className="text-xs text-white/70 tabular-nums flex-shrink-0">
        {qty} {uom && <span className="text-[9px] text-white/40 uppercase">{uom}</span>}
      </span>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {part.state === 'requisitada' && (
            <button
              type="button"
              onClick={() => updateState.mutate({ id: part.id, state: 'autorizada' })}
              className="p-1 rounded text-white/40 hover:text-neon-green hover:bg-neon-green/10"
              title="Autorizar"
            >
              <CheckCircle2 size={11} />
            </button>
          )}
          {(part.state === 'requisitada' || part.state === 'autorizada') && (
            <button
              type="button"
              onClick={() => updateState.mutate({ id: part.id, state: 'cancel' })}
              className="p-1 rounded text-white/40 hover:text-neon-pink hover:bg-neon-pink/10"
              title="Cancelar"
            >
              <XCircle size={11} />
            </button>
          )}
          {part.state === 'requisitada' && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded text-white/40 hover:text-neon-pink hover:bg-neon-pink/10"
              title="Apagar"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStateBadge({ state }: { state: OsPartState }) {
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

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-neon-blue/70">{icon}</span>}
        <p className="text-[10px] uppercase tracking-wide text-white/40">{title}</p>
      </div>
      {children}
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-1.5 mb-1 text-white/40">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm text-white/90">{value}</p>
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

function fmtDT(iso: string | false | undefined): string {
  if (!iso || typeof iso !== 'string') return '—'
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
