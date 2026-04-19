'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Wrench, Calendar, Clock, User, Building2, ShieldCheck, Info, ClipboardList, FileText, Package, Gauge, History, Pencil, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { OsStatusBadge } from './OsStatusBadge'
import { OsPriorityBadge } from './OsPriorityBadge'
import { OsTransitionBar } from './OsTransitionBar'
import { useOsStore } from '@/lib/store/osStore'
import { MAINTENANCE_TYPE_LABEL, type OdooOs, isOsOverdue } from '@/lib/types/os'

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
            {os.equipment_id && (
              <p className="text-sm text-white/60 mt-2 flex items-center gap-2">
                <Wrench size={14} className="text-neon-blue/70" />
                {os.equipment_apelido ? `${os.equipment_apelido} · ` : ''}{os.equipment_id[1]}
                {os.equipment_tag && <span className="text-white/40 text-xs">Tag {os.equipment_tag}</span>}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <AnimatedButton variant="ghost" icon={<Pencil size={14} />} onClick={() => openFormModal(os.id)}>
              Editar
            </AnimatedButton>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-[11px] uppercase tracking-wide text-white/40 mb-2">Transições</p>
          <OsTransitionBar id={os.id} state={os.state} />
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
          {tab === 'checklist' && <TabEmpty icon={<ClipboardList size={32} />} title="Check-list" count={os.check_list_count || 0} created={os.check_list_created} />}
          {tab === 'relatorios' && <TabEmpty icon={<FileText size={32} />} title="Relatórios" count={os.relatorios_count || 0} />}
          {tab === 'pecas' && <TabEmpty icon={<Package size={32} />} title="Peças solicitadas" count={os.request_parts_count || 0} />}
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

      <GlassCard className="p-5 space-y-3 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Equipamento</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <InfoLine label="Nome" value={os.equipment_id ? os.equipment_id[1] : '—'} />
          <InfoLine label="Apelido" value={os.equipment_apelido || '—'} />
          <InfoLine label="Tag" value={os.equipment_tag || '—'} />
          <InfoLine label="Modelo" value={os.equipment_model || '—'} />
          <InfoLine label="Patrimônio" value={os.equipment_patrimonio || '—'} />
          <InfoLine label="Nº de Série" value={os.equipment_serial_number || '—'} />
          <InfoLine label="Categoria" value={os.equipment_category || '—'} />
        </div>
      </GlassCard>
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
