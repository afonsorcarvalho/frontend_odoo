'use client'

import { motion } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Package, Activity, FileText,
  AlertCircle, CheckCircle2, Beaker, Gauge, FileDown, Signature,
  LineChart, Expand, Printer, Loader2, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/ui/GlassCard'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { TextViewerModal } from '@/components/ui/TextViewerModal'
import { MaterialsSection } from './MaterialsSection'
import { FotosSection } from './FotosSection'

const PdfViewerModal = dynamic(
  () => import('@/components/ui/PdfViewerModal').then((m) => m.PdfViewerModal),
  { ssr: false }
)
import { CycleStatusBadge } from './CycleStatusBadge'
import { CyclePhaseBar } from './CyclePhaseBar'
import { IBEditModal } from './IBEditModal'
import type { OdooCycle } from '@/lib/types/ciclo'
import { ReactNode, useEffect, useState } from 'react'
import odooClient from '@/lib/odoo/client'
import { getReportsFor, formatFilename } from '@/lib/odoo/reports'
import { formatOverdue } from '@/lib/utils/cycleTime'
import { useCiclosPermissions } from '@/lib/hooks/useCiclosPermissions'
import { useForceConcludeCycle } from '@/lib/hooks/useCiclos'

interface CycleDetailProps {
  cycle: OdooCycle
}

export function CycleDetail({ cycle }: CycleDetailProps) {
  const { hasField, canWrite, canReadMaterials, canPrint } = useCiclosPermissions()
  const forceConclude = useForceConcludeCycle(cycle.id)
  const [ibEditOpen, setIbEditOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [txtOpen, setTxtOpen] = useState(false)
  const [txtContent, setTxtContent] = useState<string | null>(null)
  const [txtLoading, setTxtLoading] = useState(false)
  const [txtServerFilename, setTxtServerFilename] = useState<string | undefined>()

  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfServerFilename, setPdfServerFilename] = useState<string | undefined>()
  const [pdfTitle, setPdfTitle] = useState<string>(`PDF · ${cycle.name}`)
  const [pdfFallback, setPdfFallback] = useState<string>('')

  // URL atualmente aberta (pra evitar recarregar o mesmo PDF de novo)
  const [pdfSourceKey, setPdfSourceKey] = useState<string>('')

  const graphSrc = cycle.cycle_graph
    ? `data:image/png;base64,${cycle.cycle_graph}`
    : null

  const txtPath = `/web/content/download_file_txt/${cycle.id}`
  const txtFallbackName = cycle.cycle_txt_filename || `ciclo_${cycle.id}.txt`
  const pdfPath = `/web/content/download_file_txt_to_pdf/${cycle.id}`
  const pdfFallbackName = cycle.cycle_pdf_filename || `ciclo_${cycle.id}.pdf`

  const handleOpenTxt = async () => {
    setTxtOpen(true)
    if (txtContent !== null) return // já carregado; mantém em cache
    setTxtLoading(true)
    try {
      const { content, filename } = await odooClient.fetchText(txtPath)
      setTxtContent(content)
      setTxtServerFilename(filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar TXT')
      setTxtOpen(false)
    } finally {
      setTxtLoading(false)
    }
  }

  const handleDownloadTxt = async () => {
    const t = toast.loading('Baixando TXT...')
    try {
      await odooClient.downloadBinary(txtPath, txtServerFilename ?? txtFallbackName)
      toast.success('TXT baixado', { id: t })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar', { id: t })
    }
  }

  const handleOpenPdf = async () => {
    const key = `binary:${pdfPath}`
    setPdfTitle(`PDF · ${cycle.name}`)
    setPdfFallback(pdfFallbackName)
    setPdfOpen(true)
    if (pdfSourceKey === key && pdfBlob !== null) return

    setPdfLoading(true)
    setPdfBlob(null)
    setPdfServerFilename(undefined)
    try {
      const { blob, filename } = await odooClient.fetchBinary(pdfPath)
      setPdfBlob(blob)
      setPdfServerFilename(filename)
      setPdfSourceKey(key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar PDF')
      setPdfOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    const isReport = pdfSourceKey.startsWith('report:')
    const path = isReport
      ? `/report/pdf/${encodeURIComponent(pdfSourceKey.replace('report:', '').split('|')[0])}/${cycle.id}`
      : pdfPath
    const name = pdfServerFilename ?? pdfFallback ?? pdfFallbackName
    const t = toast.loading('Baixando PDF...')
    try {
      await odooClient.downloadBinary(path, name)
      toast.success('PDF baixado', { id: t })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar', { id: t })
    }
  }

  /**
   * Abre o visualizador de PDF com um report (ex: Impressão de Ciclo, Laudo).
   * Reusa o mesmo PdfViewerModal; trocando a fonte, faz novo fetch.
   */
  const handleOpenReport = async (reportName: string, label: string, filenamePattern?: string) => {
    const key = `report:${reportName}|${cycle.id}`
    const fallback = formatFilename(filenamePattern, { id: cycle.id, name: cycle.name })
    setPdfTitle(`${label} · ${cycle.name}`)
    setPdfFallback(fallback)
    setPdfOpen(true)
    if (pdfSourceKey === key && pdfBlob !== null) return

    setPdfLoading(true)
    setPdfBlob(null)
    setPdfServerFilename(undefined)
    try {
      const { blob, filename } = await odooClient.fetchReportPdf(reportName, [cycle.id])
      setPdfBlob(blob)
      setPdfServerFilename(filename)
      setPdfSourceKey(key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar relatório')
      setPdfOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CycleStatusBadge state={cycle.state} />
                {cycle.is_overdue && (
                  <span className="overdue-glow inline-flex items-center gap-1 text-xs text-neon-pink font-medium">
                    <AlertCircle size={12} />
                    Atrasado
                    {formatOverdue(cycle) && (
                      <span className="text-neon-pink/80">· {formatOverdue(cycle)}</span>
                    )}
                  </span>
                )}
                {cycle.is_signed && (
                  <span className="inline-flex items-center gap-1 text-xs text-neon-green font-medium">
                    <CheckCircle2 size={12} /> Assinado
                  </span>
                )}
                {cycle.ib_resultado && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    cycle.ib_resultado === 'positivo'
                      ? 'text-red-400 ib-positivo-glow'
                      : 'text-neon-green ib-negativo-glow'
                  }`}>
                    <Beaker size={12} /> IB {cycle.ib_resultado}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{cycle.name}</h1>
              {cycle.equipment_id && (
                <p className="text-white/60 text-sm flex items-center gap-2">
                  <Activity size={14} className="text-neon-blue/70" />
                  {cycle.equipment_nickname
                    ? `${cycle.equipment_nickname} · ${cycle.equipment_id[1]}`
                    : cycle.equipment_id[1]}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {canWrite && cycle.is_overdue && cycle.state !== 'concluido' && cycle.state !== 'cancelado' && (
                <motion.button
                  onClick={() => {
                    if (window.confirm('Forçar conclusão deste ciclo agora? O fim será registado como a hora actual.')) {
                      forceConclude.mutate()
                    }
                  }}
                  disabled={forceConclude.isPending}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink/20 to-neon-orange/20 border border-neon-pink/30 text-neon-pink font-medium text-sm hover:border-neon-pink/50 transition-all disabled:opacity-50"
                >
                  {forceConclude.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <CheckCircle2 size={14} />}
                  {forceConclude.isPending ? 'Concluindo...' : 'Forçar conclusão'}
                </motion.button>
              )}
              {canPrint && <PrintMenu onOpenReport={handleOpenReport} />}
            </div>
          </div>

          <div className="mt-5">
            <CyclePhaseBar cycle={cycle} variant="full" />
          </div>

          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FileDown size={13} className="text-neon-blue" />
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Arquivos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileDownloadButton
                kind="pdf"
                path={pdfPath}
                filename={pdfFallbackName}
                label="Visualizar PDF"
                subFilename={cycle.cycle_pdf_filename || undefined}
                onClick={handleOpenPdf}
              />
              <FileDownloadButton
                kind="txt"
                path={txtPath}
                filename={txtFallbackName}
                label="Visualizar TXT"
                subFilename={cycle.cycle_txt_filename || undefined}
                onClick={handleOpenTxt}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Identificação & Temporização" icon={<Package size={14} />} delay={0.1} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Field label="Número do lote" value={asStr(cycle.batch_number)} />
            <Field label="Início" value={formatDateTime(cycle.start_date)} />
            <Field label="Categoria equip." value={cycle.equipment_category_id ? cycle.equipment_category_id[1] : '—'} />
            <Field label="Fim" value={formatDateTime(cycle.end_date)} />
            <Field label="Duração prevista" value={formatDuration(cycle.duration_planned ? cycle.duration_planned / 60 : false)} />
            <Field
              label="Duração"
              value={
                cycle.state === 'em_andamento' && cycle.start_date
                  ? <LiveDuration startDate={cycle.start_date} />
                  : formatDuration(cycle.duration)
              }
            />
          </div>
        </Section>

        {canReadMaterials && <MaterialsSection cycleId={cycle.id} delay={0.25} />}

        {hasField('ib_resultado') && (
          <Section
            title="Indicador Biológico"
            icon={<Beaker size={14} />}
            delay={0.3}
            wide
            alert={cycle.ib_resultado === 'positivo'}
            action={canWrite && (
              <button
                onClick={() => setIbEditOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-neon-blue border border-neon-blue/30 bg-neon-blue/5 hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all"
              >
                Editar
              </button>
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <Field
                label="Resultado"
                value={
                  cycle.ib_resultado
                    ? (
                      <span className={`font-medium capitalize ${
                        cycle.ib_resultado === 'positivo'
                          ? 'text-red-400 ib-positivo-glow'
                          : 'text-neon-green ib-negativo-glow'
                      }`}>
                        {cycle.ib_resultado}
                      </span>
                    )
                    : '—'
                }
              />
              <Field label="Lote" value={cycle.ib_lote ? cycle.ib_lote[1] : '—'} />
              <Field label="Marca" value={asStr(cycle.ib_marca)} />
              <Field label="Modelo" value={asStr(cycle.ib_modelo)} />
              <Field label="Início incubação" value={formatDateTime(cycle.ib_data_inicio)} />
              <Field label="Fim incubação" value={formatDateTime(cycle.ib_data_fim)} />
            </div>
          </Section>
        )}

        {hasField('is_signed') && cycle.is_signed && (
          <Section title="Assinatura" icon={<Signature size={14} />} delay={0.35}>
            <Field label="Assinante" value={asStr(cycle.signature_employee_name) || (cycle.signature_employee_id ? cycle.signature_employee_id[1] : '—')} />
            <Field label="Data" value={formatDateTime(cycle.signature_date)} />
            <Field label="Conselho" value={asStr(cycle.signature_professional_council)} />
            <Field label="Nº conselho" value={asStr(cycle.signature_professional_council_number)} />
          </Section>
        )}
      </div>

      {(graphSrc || cycle.is_eto_equipment) && (hasField('massa_eto') || hasField('cycle_graph')) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <GlassCard>
            {cycle.is_eto_equipment && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                  <Gauge size={14} className="text-neon-purple" />
                  <h3 className="text-sm font-semibold text-white">Parâmetros ETO</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                  <Field label="Massa ETO (kg)" value={fmtNum(cycle.massa_eto)} />
                  <Field label="Gás admitido (kg)" value={fmtNum(cycle.massa_gas_eto)} />
                  <Field label="Gás setpoint (kg)" value={fmtNum(cycle.massa_gas_eto_setpoint)} />
                  <Field label="Concentração (mg/L)" value={fmtNum(cycle.concentracao_eto_camara)} />
                  <Field label="ETO (%)" value={fmtNum(cycle.concentracao_eto_porcentagem)} />
                </div>
              </div>
            )}

            {graphSrc && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LineChart size={14} className="text-neon-blue" />
                    <h3 className="text-sm font-semibold text-white">Gráfico do Ciclo</h3>
                  </div>
                  <button
                    onClick={() => setGraphOpen(true)}
                    className="text-[11px] text-neon-blue hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Expand size={11} /> Ampliar
                  </button>
                </div>

                <motion.button
                  onClick={() => setGraphOpen(true)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative w-full group rounded-xl overflow-hidden border border-white/10 bg-white"
                >
                  <img
                    src={graphSrc}
                    alt="Gráfico do ciclo"
                    loading="lazy"
                    className="w-full h-auto max-h-64 object-contain opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-blue/20 border border-neon-blue/40 text-xs text-white font-medium backdrop-blur-sm">
                      <Expand size={12} /> Clique para ampliar
                    </span>
                  </div>
                </motion.button>

                {cycle.cycle_graph_filename && (
                  <p className="text-[10px] text-white/30 font-mono mt-2 truncate">
                    {cycle.cycle_graph_filename}
                  </p>
                )}
              </>
            )}
          </GlassCard>

          {graphSrc && (
            <ImageViewerModal
              open={graphOpen}
              onOpenChange={setGraphOpen}
              src={graphSrc}
              title={`Gráfico · ${cycle.name}`}
              filename={cycle.cycle_graph_filename || 'cycle_graph.png'}
            />
          )}
        </motion.div>
      )}

      <FotosSection cycleId={cycle.id} delay={0.42} />

      {cycle.notes && hasField('notes') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <GlassCard>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-neon-blue" />
              <h3 className="text-sm font-semibold text-white">Observações</h3>
            </div>
            <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
              {cycle.notes}
            </p>
          </GlassCard>
        </motion.div>
      )}

      <TextViewerModal
        open={txtOpen}
        onOpenChange={setTxtOpen}
        content={txtContent}
        isLoading={txtLoading}
        title={`TXT · ${cycle.name}`}
        filename={txtServerFilename || cycle.cycle_txt_filename || txtFallbackName}
        onDownload={handleDownloadTxt}
      />

      <PdfViewerModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        file={pdfBlob}
        isLoading={pdfLoading}
        title={pdfTitle}
        filename={pdfServerFilename || pdfFallback || pdfFallbackName}
        onDownload={handleDownloadPdf}
      />

      <IBEditModal
        open={ibEditOpen}
        onClose={() => setIbEditOpen(false)}
        cycle={cycle}
      />
    </div>
  )
}

function Section({
  title, icon, delay, children, wide, action, alert,
}: { title: string; icon: ReactNode; delay: number; children: ReactNode; wide?: boolean; action?: ReactNode; alert?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={wide ? 'md:col-span-2' : undefined}
    >
      <GlassCard alert={alert}>
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={alert ? 'text-red-400' : 'text-neon-blue'}>{icon}</span>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          {action}
        </div>
        <div className="space-y-2">{children}</div>
      </GlassCard>
    </motion.div>
  )
}

function Field({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  const display = value === '' || value === null || value === undefined ? '—' : value
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-white/40 w-32 flex-shrink-0 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-white/80 flex-1 break-words">{display}</span>
    </div>
  )
}

function LiveDuration({ startDate }: { startDate: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startDate])

  const start = new Date(startDate.replace(' ', 'T') + 'Z').getTime()
  if (isNaN(start)) return <>—</>
  const ms = Math.max(0, now - start)
  const totalMin = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const text = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}min ${sec}s`
    : `${m}min ${sec}s`
  return (
    <span className="font-mono text-neon-green tabular-nums">
      {text} <span className="text-white/40 font-sans">(em andamento)</span>
    </span>
  )
}

function asStr(v: string | false | null | undefined): string {
  return v && typeof v === 'string' ? v : ''
}

function fmtNum(v: number | false | null | undefined): string {
  if (v === false || v === null || v === undefined) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

function formatDateTime(iso: string | false | null | undefined): string {
  if (!iso || typeof iso !== 'string') return '—'
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(hours: number | false | null | undefined): string {
  if (!hours || hours === 0) return '—'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}


function FileDownloadButton({
  kind, path, filename, label, subFilename, onClick,
}: {
  kind: 'pdf' | 'txt'
  path: string
  filename: string
  label: string
  subFilename?: string
  onClick?: () => void | Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (onClick) {
      await onClick()
      return
    }
    setLoading(true)
    const t = toast.loading(`Baixando ${kind.toUpperCase()}...`)
    try {
      await odooClient.downloadBinary(path, filename)
      toast.success(`${kind.toUpperCase()} baixado`, { id: t })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar', { id: t })
    } finally {
      setLoading(false)
    }
  }

  const isPdf = kind === 'pdf'
  const colors = isPdf
    ? 'border-neon-orange/25 bg-neon-orange/[0.04] text-neon-orange/80 hover:bg-neon-orange/[0.08] hover:border-neon-orange/40 hover:text-neon-orange hover:shadow-[0_0_24px_rgba(245,158,11,0.18)]'
    : 'border-neon-blue/30 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/60 hover:shadow-[0_0_24px_rgba(0,212,255,0.25)]'

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <motion.button
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 font-semibold transition-all duration-300 disabled:opacity-50 ${colors}`}
      >
        <div className={`flex-shrink-0 ${isPdf ? 'text-neon-orange/80' : 'text-neon-blue'}`}>
          {loading
            ? <Loader2 size={36} className="animate-spin" />
            : isPdf ? <PdfIcon /> : <TxtIcon />}
        </div>
        <div className="flex-1 flex flex-col items-start leading-tight text-left min-w-0">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-[11px] opacity-60 font-mono uppercase mt-0.5">
            .{kind}
          </span>
        </div>
        <FileDown size={16} className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
      </motion.button>

      {subFilename && (
        <p
          className="text-[10px] text-white/40 font-mono px-1 truncate"
          title={subFilename}
        >
          {subFilename}
        </p>
      )}
    </div>
  )
}

function PdfIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <text x="6.5" y="18" fontSize="5.5" fontWeight="800" fill="currentColor" stroke="none" letterSpacing="0.3">PDF</text>
    </svg>
  )
}

function TxtIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <text x="6.5" y="18" fontSize="5.5" fontWeight="800" fill="currentColor" stroke="none" letterSpacing="0.3">TXT</text>
    </svg>
  )
}

function PrintMenu({
  onOpenReport,
}: {
  onOpenReport: (reportName: string, label: string, filenamePattern?: string) => void | Promise<void>
}) {
  const [printing, setPrinting] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const reports = getReportsFor('afr.supervisorio.ciclos')

  if (reports.length === 0) return null

  const handlePrint = (reportName: string, label: string, pattern?: string) => {
    setOpen(false)
    setPrinting(reportName)
    Promise.resolve(onOpenReport(reportName, label, pattern)).finally(() => setPrinting(null))
  }

  if (reports.length === 1) {
    const r = reports[0]
    return (
      <motion.button
        onClick={() => handlePrint(r.report_name, r.label, r.filename_pattern)}
        disabled={printing !== null}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white font-medium text-sm hover:border-neon-blue/50 shadow-glow-sm hover:shadow-glow-blue transition-all disabled:opacity-50"
      >
        {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
        {printing ? 'Gerando...' : r.label}
      </motion.button>
    )
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <motion.button
          disabled={printing !== null}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white font-medium text-sm hover:border-neon-blue/50 shadow-glow-sm hover:shadow-glow-blue transition-all disabled:opacity-50 data-[state=open]:border-neon-blue/60"
        >
          {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
          {printing ? 'Gerando...' : 'Imprimir'}
          {!printing && (
            <ChevronDown
              size={13}
              className="transition-transform data-[state=open]:rotate-180"
            />
          )}
        </motion.button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[260px] rounded-xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent" />
          <div className="p-1">
            {reports.map((r) => (
              <DropdownMenu.Item
                key={r.report_name}
                onSelect={(e) => {
                  e.preventDefault()
                  handlePrint(r.report_name, r.label, r.filename_pattern)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/5 data-[highlighted]:bg-white/5 data-[highlighted]:text-white outline-none cursor-pointer transition-colors"
              >
                <FileText size={13} className="text-neon-blue/70 flex-shrink-0" />
                <span className="flex-1 truncate">{r.label}</span>
                <FileDown size={12} className="text-white/30" />
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
