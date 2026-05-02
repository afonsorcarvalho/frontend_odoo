'use client'

import { useState, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Wrench, Calendar, Clock, User, Building2, ShieldCheck, Info, ClipboardList, FileText, Package, Gauge, History, Pencil, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { PrintMenu } from '@/components/ui/PrintMenu'
import { OsStatusBadge } from './OsStatusBadge'
import { OsPriorityBadge } from './OsPriorityBadge'
import { OsTransitionBar } from './OsTransitionBar'
import { OsChecklistTab } from './OsChecklistTab'
import { OsRelatoriosTab } from './OsRelatoriosTab'
import { OsPecasTab } from './OsPecasTab'
import { OsSignaturesSection } from './OsSignaturesSection'
import { OsSignMenu } from './OsSignMenu'
import toast from 'react-hot-toast'
import { useOsStore } from '@/lib/store/osStore'
import { usePdfReport } from '@/lib/hooks/usePdfReport'
import {
  useGenerateChecklist,
  useTransitionOs,
  useCreateRelatorio,
  useOsRelatorios,
} from '@/lib/hooks/useOs'
import { MAINTENANCE_TYPE_LABEL, OS_TERMINAL_STATES, type OdooOs, type OsRelatorio, isOsOverdue } from '@/lib/types/os'
import { OsRelatorioModal } from './OsRelatorioModal'

const PdfViewerModal = dynamic(
  () => import('@/components/ui/PdfViewerModal').then((m) => m.PdfViewerModal),
  { ssr: false }
)

type TabKey = 'geral' | 'checklist' | 'relatorios' | 'pecas' | 'calibracao' | 'historico'

interface TabDef {
  key: TabKey
  label: string
  icon: ReactNode
  count?: number
}

export function OsDetail({ os }: { os: OdooOs }) {
  const [tab, setTab] = useState<TabKey>('geral')
  const openFormModal = useOsStore((s) => s.openFormModal)
  const overdue = isOsOverdue(os)
  const isTerminal = os.state ? OS_TERMINAL_STATES.includes(os.state as never) : false
  const canEdit = os.state === 'draft'
  const pdf = usePdfReport()

  // Fluxo "Iniciar execução"
  const generateChecklist = useGenerateChecklist(os.id)
  const transition = useTransitionOs()
  const createRelatorio = useCreateRelatorio(os.id)
  const { data: relatoriosList } = useOsRelatorios(os.id)
  const [execRelatorio, setExecRelatorio] = useState<OsRelatorio | null>(null)
  const [execModalOpen, setExecModalOpen] = useState(false)
  const [execBusy, setExecBusy] = useState(false)

  const handleOpenReport = (reportName: string, label: string, pattern?: string) => {
    return pdf.openReport(reportName, [os.id], label, pattern, { id: os.id, name: os.name })
  }

  const handleIniciarExecucao = async () => {
    if (execBusy) return
    setExecBusy(true)
    const t = toast.loading('Iniciando execução...')
    try {
      // 1. Gera checklist se aplicável e ainda não gerado
      const checklistTypes = ['preventive', 'loan', 'calibration']
      const shouldGenerate =
        !os.check_list_created &&
        os.maintenance_type &&
        checklistTypes.includes(os.maintenance_type as never)
      if (shouldGenerate) {
        toast.loading('1/3 · Gerando checklist...', { id: t })
        try {
          await generateChecklist.mutateAsync()
        } catch {
          // ignora falha de checklist — segue fluxo
        }
      }
      // 2. Transição para under_repair
      toast.loading(`${shouldGenerate ? '2/3' : '1/2'} · Alterando status da OS para "Em execução"...`, { id: t })
      await transition.mutateAsync({ id: os.id, targetState: 'under_repair' })
      // 3. Cria relatório draft com defaults
      toast.loading(`${shouldGenerate ? '3/3' : '2/2'} · Criando relatório de serviço...`, { id: t })
      const pad = (n: number) => String(n).padStart(2, '0')
      const fmt = (d: Date) =>
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`
      const start = new Date()
      const end = new Date(start.getTime() + 60 * 60 * 1000) // +1h
      const startIso = fmt(start)
      const endIso = fmt(end)
      const techIds = os.tecnico_id ? [os.tecnico_id[0]] : []
      const newId = await createRelatorio.mutateAsync({
        os_id: os.id,
        report_type: 'manutencao',
        fault_description: os.problem_description || '',
        service_summary: '',
        technicians: [[6, 0, techIds]] as never,
        data_atendimento: startIso,
        data_fim_atendimento: endIso,
      } as never)
      toast.success('Execução iniciada. Abrindo relatório...', { id: t })
      // 4. Muda para tab Relatórios e abre modal de edição
      setTab('relatorios')
      // Monta um relatorio mínimo para o modal editar via id
      setExecRelatorio({
        id: newId as unknown as number,
        name: '',
        state: 'draft',
        os_id: [os.id, os.name],
        report_type: 'manutencao',
        fault_description: os.problem_description || false,
        service_summary: false,
        observations: false,
        pendency: false,
        technicians: techIds,
        state_equipment: false,
        restriction_type: false,
        data_atendimento: startIso,
        data_fim_atendimento: endIso,
        time_execution: false,
        checklist_item_ids: [],
      })
      setExecModalOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar execução', { id: t })
    } finally {
      setExecBusy(false)
    }
  }

  // Se a lista de relatórios atualizar e tivermos um execRelatorio com ID, substitui pelo real
  const liveRelatorio = execRelatorio
    ? relatoriosList?.find((r) => r.id === execRelatorio.id) ?? execRelatorio
    : null

  const tabs: TabDef[] = [
    { key: 'geral',       label: 'Geral',       icon: <Info size={14} /> },
    { key: 'checklist',   label: 'Check-list',  icon: <ClipboardList size={14} />, count: os.check_list_count || 0 },
    { key: 'relatorios',  label: 'Relatórios',  icon: <FileText size={14} />,      count: os.relatorios_count || 0 },
    { key: 'pecas',       label: 'Peças',       icon: <Package size={14} />,       count: os.request_parts_count || 0 },
    { key: 'calibracao',  label: 'Calibração',  icon: <Gauge size={14} /> },
    { key: 'historico',   label: 'Histórico',   icon: <History size={14} /> },
  ]

  return (
    <div className="space-y-6">
      <GlassCard className={clsx('p-6', overdue && 'overdue-card-glow')}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-white">{os.name}</h1>
              <OsStatusBadge state={os.state} />
              <OsPriorityBadge priority={os.priority} />
              {os.maintenance_type && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple border border-neon-purple/30">
                  <Wrench size={11} />
                  {MAINTENANCE_TYPE_LABEL[os.maintenance_type]}
                </span>
              )}
              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs text-neon-pink font-medium">
                  <AlertCircle size={12} /> Atrasada
                </span>
              )}
              {os.is_warranty && (
                <span className="inline-flex items-center gap-1 text-xs text-neon-green font-medium">
                  <ShieldCheck size={12} /> Garantia {os.warranty_type === 'fabrica' ? 'Fábrica' : 'Serviço'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <OsSignMenu os={os} />
            <PrintMenu
              model="engc.os"
              onOpenReport={handleOpenReport}
              filterReports={(r) =>
                r.report_name !== 'engc_os.report_checklist_blank_template' || !!os.check_list_created
              }
            />
            {canEdit && (
              <AnimatedButton variant="ghost" icon={<Pencil size={14} />} onClick={() => openFormModal(os.id)}>
                Editar
              </AnimatedButton>
            )}
          </div>

        </div>

        {os.equipment_id && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={13} className="text-neon-blue" />
              <p className="text-[11px] uppercase tracking-wide text-white/40">Equipamento</p>
            </div>
            <div className="flex items-start gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">
                  {os.equipment_apelido ? `${os.equipment_apelido} · ` : ''}{os.equipment_id[1]}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 mt-2 text-xs">
                  {os.equipment_tag && <InfoLine label="Tag" value={os.equipment_tag} />}
                  {os.equipment_model && <InfoLine label="Modelo" value={os.equipment_model} />}
                  {os.equipment_patrimonio && <InfoLine label="Patrimônio" value={os.equipment_patrimonio} />}
                  {os.equipment_serial_number && <InfoLine label="Nº de Série" value={os.equipment_serial_number} />}
                  {os.equipment_category && <InfoLine label="Categoria" value={os.equipment_category} />}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[11px] uppercase tracking-wide text-white/40 mb-2">Ações</p>
          <OsTransitionBar
            id={os.id}
            state={os.state}
            onIniciarExecucao={handleIniciarExecucao}
            busy={execBusy}
          />
        </div>
      </GlassCard>

      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label} count={t.count} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'geral' && <TabGeral os={os} />}
          {tab === 'checklist' && <OsChecklistTab os={os} />}
          {tab === 'relatorios' && <OsRelatoriosTab os={os} />}
          {tab === 'pecas' && <OsPecasTab os={os} />}
          {tab === 'calibracao' && (
            <TabEmpty
              icon={<Gauge size={32} />}
              title="Calibração"
              extra={os.calibration_id ? `Calibração vinculada: ${os.calibration_id[1]}` : 'Nenhuma calibração vinculada'}
            />
          )}
          {tab === 'historico' && <TabHistorico os={os} />}
        </motion.div>
      </AnimatePresence>

      <PdfViewerModal
        open={pdf.pdfOpen}
        onOpenChange={pdf.setPdfOpen}
        file={pdf.pdfBlob}
        isLoading={pdf.pdfLoading}
        title={pdf.pdfTitle}
        filename={pdf.pdfServerFilename ?? pdf.pdfFallback}
      />

      <OsRelatorioModal
        open={execModalOpen}
        onClose={() => { setExecModalOpen(false); setExecRelatorio(null) }}
        osId={os.id}
        editing={liveRelatorio}
        os={os}
      />
    </div>
  )
}

function TabGeral({ os }: { os: OdooOs }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Informações gerais</h3>
        <Field icon={<Wrench size={13} />} label="Tipo" value={os.maintenance_type ? MAINTENANCE_TYPE_LABEL[os.maintenance_type] : '—'} />
        <Field icon={<User size={13} />} label="Solicitante" value={os.solicitante || '—'} />
        <Field icon={<User size={13} />} label="Técnico" value={os.tecnico_id ? os.tecnico_id[1] : '—'} />
        <Field icon={<Building2 size={13} />} label="Departamento" value={os.department ? os.department[1] : '—'} />
        <Field icon={<Building2 size={13} />} label="Empresa (terceirizada)" value={os.empresa_manutencao ? os.empresa_manutencao[1] : '—'} />
        <Field icon={<User size={13} />} label="Cliente" value={os.client_id ? os.client_id[1] : '—'} />
        <Field icon={<Info size={13} />} label="Executor" value={os.who_executor === 'own' ? 'Própria' : os.who_executor === '3rd_party' ? 'Terceirizada' : '—'} />
        <Field icon={<Info size={13} />} label="Origem" value={os.origin || '—'} />
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Datas e duração</h3>
        <Field icon={<Calendar size={13} />} label="Requisição" value={fmt(os.date_request)} />
        <Field icon={<Calendar size={13} />} label="Programada" value={fmt(os.date_scheduled)} />
        <Field icon={<Calendar size={13} />} label="Execução" value={fmt(os.date_execution)} />
        <Field icon={<Calendar size={13} />} label="Início" value={fmt(os.date_start)} />
        <Field icon={<Calendar size={13} />} label="Término" value={fmt(os.date_finish)} />
        <Field icon={<Clock size={13} />} label="Duração estimada" value={os.maintenance_duration ? `${os.maintenance_duration}h` : '—'} />
      </GlassCard>

      <GlassCard className="p-5 space-y-3 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Descrições</h3>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40 mb-1">Chamado</p>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{os.problem_description || '—'}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40 mb-1">Serviço</p>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{os.service_description || '—'}</p>
        </div>
      </GlassCard>

      <div className="lg:col-span-2">
        <OsSignaturesSection os={os} />
      </div>
    </div>
  )
}

function TabEmpty({ icon, title, count, extra, created }: { icon: ReactNode; title: string; count?: number; extra?: string; created?: boolean }) {
  return (
    <GlassCard className="p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-3 text-neon-blue/70">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {typeof count === 'number' && (
        <p className="text-sm text-white/50">
          {count} registro{count === 1 ? '' : 's'}
          {created !== undefined && ` · ${created ? 'gerado' : 'não gerado'}`}
        </p>
      )}
      {extra && <p className="text-sm text-white/50 mt-1">{extra}</p>}
      <p className="text-xs text-white/30 mt-3">
        A edição detalhada deste módulo ainda é feita no Odoo.
      </p>
    </GlassCard>
  )
}

function TabHistorico({ os }: { os: OdooOs }) {
  return (
    <GlassCard className="p-5 space-y-2">
      <h3 className="text-sm font-semibold text-white/80">Metadados</h3>
      <div className="text-xs text-white/60 space-y-1">
        <p>Criada em: {fmt(os.create_date)}</p>
        <p>Criada por: {os.create_uid ? os.create_uid[1] : '—'}</p>
        <p>Última atualização: {fmt(os.write_date || false)}</p>
        <p>Empresa: {os.company_id ? os.company_id[1] : '—'}</p>
      </div>
    </GlassCard>
  )
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
        active ? 'bg-neon-blue/20 text-neon-blue' : 'text-white/50 hover:text-white'
      )}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-white/70">{count}</span>
      )}
    </button>
  )
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-neon-blue/70 flex-shrink-0">{icon}</span>
      <span className="text-white/40 w-32 flex-shrink-0">{label}</span>
      <span className="text-white/80 truncate">{value}</span>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-white/80 truncate">{value}</p>
    </div>
  )
}

function fmt(iso: string | false | undefined): string {
  if (!iso) return '—'
  const d = new Date(String(iso).replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
