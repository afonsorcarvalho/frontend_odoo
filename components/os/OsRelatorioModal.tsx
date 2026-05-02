'use client'

import { useEffect, useState } from 'react'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Search, User, ClipboardList, CheckCheck, Wand2 } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { ActionButton } from '@/components/ui/ActionButton'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  useCreateRelatorio,
  useUpdateRelatorio,
  useEmployees,
  useOsChecklist,
  usePeriodicityNames,
} from '@/lib/hooks/useOs'
import { ChecklistManagerModal } from './ChecklistManagerModal'
import {
  OS_RELATORIO_TYPE_LABEL,
  OS_STATE_EQUIPMENT_LABEL,
  type OsRelatorio,
  type OsRelatorioType,
  type OsStateEquipment,
  type OsChecklistItem,
  type OdooOs,
} from '@/lib/types/os'

const schema = z.object({
  report_type: z.enum(['orcamento', 'manutencao', 'instalacao', 'treinamento', 'calibracao', 'qualificacao']),
  fault_description: z.string().min(1, 'Campo obrigatório'),
  service_summary: z.string().min(1, 'Campo obrigatório'),
  technicians: z.array(z.number()).min(1, 'Selecione ao menos um técnico'),
  data_atendimento: z.string().min(1, 'Campo obrigatório'),
  data_fim_atendimento: z.string().min(1, 'Campo obrigatório'),
  state_equipment: z.enum(['parado', 'funcionando', 'restricao']).optional(),
  restriction_type: z.string().optional(),
  observations: z.string().optional(),
  pendency: z.string().optional(),
  checklist_item_ids: z.array(z.number()).default([]),
}).superRefine((data, ctx) => {
  if (data.state_equipment === 'restricao' && !data.restriction_type?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['restriction_type'],
      message: 'Descreva a restrição',
    })
  }
  if (data.data_atendimento && data.data_fim_atendimento) {
    const start = new Date(data.data_atendimento).getTime()
    const end = new Date(data.data_fim_atendimento).getTime()
    if (!isNaN(start) && !isNaN(end) && start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data_fim_atendimento'],
        message: 'Fim deve ser posterior ao início',
      })
    }
  }
})

type FormValues = z.infer<typeof schema>

function toInputDT(iso: string | false | undefined): string {
  if (!iso || typeof iso !== 'string') return ''
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function toOdooDT(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`
}

interface OsRelatorioModalProps {
  open: boolean
  onClose: () => void
  osId: number
  editing?: OsRelatorio | null
  os?: OdooOs | null
}

export function OsRelatorioModal({ open, onClose, osId, editing, os }: OsRelatorioModalProps) {
  const { data: employees } = useEmployees()
  const { data: checklistItems } = useOsChecklist(osId)
  const periodIds = os?.periodicity_ids || []
  const { data: periodicities } = usePeriodicityNames(periodIds)
  const createMutation = useCreateRelatorio(osId)
  const updateMutation = useUpdateRelatorio(osId)

  const isEditing = !!editing

  const {
    register, handleSubmit, watch, reset, control, setValue, getValues, trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      report_type: 'manutencao',
      fault_description: '',
      service_summary: '',
      technicians: [],
      data_atendimento: '',
      data_fim_atendimento: '',
      checklist_item_ids: [],
    },
  })

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          report_type: (editing.report_type || 'manutencao') as OsRelatorioType,
          fault_description: editing.fault_description || '',
          service_summary: editing.service_summary || '',
          technicians: editing.technicians || [],
          data_atendimento: toInputDT(editing.data_atendimento),
          data_fim_atendimento: toInputDT(editing.data_fim_atendimento),
          state_equipment: (editing.state_equipment || undefined) as OsStateEquipment | undefined,
          restriction_type: editing.restriction_type || '',
          observations: editing.observations || '',
          pendency: editing.pendency || '',
          checklist_item_ids: editing.checklist_item_ids || [],
        })
      } else {
        // Default: início = agora, fim = agora + 1h
        const pad = (n: number) => String(n).padStart(2, '0')
        const now = new Date()
        const plusHour = new Date(now.getTime() + 60 * 60 * 1000)
        const localFmt = (d: Date) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        reset({
          report_type: 'manutencao',
          fault_description: '',
          service_summary: '',
          technicians: [],
          data_atendimento: localFmt(now),
          data_fim_atendimento: localFmt(plusHour),
          checklist_item_ids: [],
        })
      }
    }
  }, [open, editing, reset])

  // Dispara validação imediata ao abrir — destaca campos obrigatórios vazios
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => { trigger() }, 50)
      return () => clearTimeout(t)
    }
  }, [open, editing, trigger])

  const stateEquipment = watch('state_equipment')

  useEffect(() => {
    if (open && stateEquipment === 'restricao') trigger('restriction_type')
  }, [stateEquipment, open, trigger])

  const onSubmit = (data: FormValues) => {
    const techCmd = [[6, 0, data.technicians]]
    const checklistCmd = [[6, 0, data.checklist_item_ids || []]]
    const payload = {
      os_id: osId,
      report_type: data.report_type,
      fault_description: data.fault_description,
      service_summary: data.service_summary,
      technicians: techCmd,
      data_atendimento: toOdooDT(data.data_atendimento),
      data_fim_atendimento: toOdooDT(data.data_fim_atendimento),
      state_equipment: data.state_equipment || false,
      restriction_type: data.restriction_type || false,
      observations: data.observations || false,
      pendency: data.pendency || false,
      checklist_item_ids: checklistCmd,
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: editing!.id, vals: payload as never },
        { onSuccess: onClose }
      )
    } else {
      createMutation.mutate(payload as never, { onSuccess: onClose })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEscapeKey(open, onClose)

  const content = (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-neon-blue" />
                  <h2 className="text-base font-semibold text-white">
                    {isEditing ? 'Editar Relatório' : 'Novo Relatório'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tipo de Relatório" required error={errors.report_type?.message}>
                    <select {...register('report_type')} className={inputClass(!!errors.report_type)}>
                      {(Object.keys(OS_RELATORIO_TYPE_LABEL) as OsRelatorioType[]).map((t) => (
                        <option key={t} value={t} className="bg-dark-800">
                          {OS_RELATORIO_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Estado do Equipamento">
                    <select {...register('state_equipment')} className={inputClass(false)}>
                      <option value="" className="bg-dark-800">—</option>
                      {(Object.keys(OS_STATE_EQUIPMENT_LABEL) as OsStateEquipment[]).map((s) => (
                        <option key={s} value={s} className="bg-dark-800">
                          {OS_STATE_EQUIPMENT_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {stateEquipment === 'restricao' && (
                  <Field label="Descrição da Restrição" required error={errors.restriction_type?.message}>
                    <textarea {...register('restriction_type')} rows={2} className={inputClass(!!errors.restriction_type)} />
                  </Field>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Início do Atendimento" required error={errors.data_atendimento?.message}>
                    <input type="datetime-local" {...register('data_atendimento')} className={inputClass(!!errors.data_atendimento)} />
                  </Field>
                  <Field label="Fim do Atendimento" required error={errors.data_fim_atendimento?.message}>
                    <input type="datetime-local" {...register('data_fim_atendimento')} className={inputClass(!!errors.data_fim_atendimento)} />
                  </Field>
                </div>

                <Field label="Técnicos" required error={errors.technicians?.message}>
                  <Controller
                    name="technicians"
                    control={control}
                    render={({ field }) => (
                      <TechnicianPicker
                        value={field.value}
                        onChange={field.onChange}
                        employees={employees || []}
                        hasError={!!errors.technicians}
                      />
                    )}
                  />
                </Field>

                {checklistItems && checklistItems.length > 0 && (
                  <Controller
                    name="checklist_item_ids"
                    control={control}
                    render={({ field }) => (
                      <ChecklistField
                        osId={osId}
                        items={checklistItems}
                        included={field.value || []}
                        onChange={field.onChange}
                        currentRelatorioId={editing?.id}
                      />
                    )}
                  />
                )}

                {os?.maintenance_type === 'preventive' &&
                  checklistItems &&
                  checklistItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const periodNames = (periodicities || []).map((p) => p.name).join(', ')
                        const fault = `Manutenção Preventiva${periodNames ? ` (${periodNames})` : ''}`
                        const includedIds = (getValues('checklist_item_ids') || []) as number[]
                        const currentRelatorioId = editing?.id
                        // Items disponíveis (mesma regra do manager)
                        const availableItems = checklistItems.filter((it) => {
                          if (includedIds.includes(it.id)) return true
                          if (currentRelatorioId && it.relatorio_id && it.relatorio_id[0] === currentRelatorioId) return true
                          if (it.check && it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
                          if (it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
                          return true
                        })
                        // Resumo: apenas items verificados (check=true) entre os incluídos
                        const chosen = availableItems.filter((it) => includedIds.includes(it.id) && it.check)
                        // Pendências: items excluídos (disponíveis mas fora do relatório)
                        const excluded = availableItems.filter((it) => !includedIds.includes(it.id))

                        // Mescla novos items agrupados por seção ao texto existente
                        // sem duplicar bullets ou headers ## Seção ##
                        const mergeSectioned = (existing: string, list: OsChecklistItem[]): string => {
                          // Parse existing em map seção→Set(bullets)
                          const existingMap = new Map<string, Set<string>>()
                          const order: string[] = []
                          const looseBullets = new Set<string>() // bullets sem seção declarada
                          let currentSec: string | null = null
                          for (const rawLine of (existing || '').split('\n')) {
                            const line = rawLine.trim()
                            if (!line) continue
                            const hdr = line.match(/^##\s*(.+?)\s*##$/)
                            if (hdr) {
                              currentSec = hdr[1]
                              if (!existingMap.has(currentSec)) {
                                existingMap.set(currentSec, new Set())
                                order.push(currentSec)
                              }
                            } else if (line.startsWith('-')) {
                              const b = line.replace(/^-+\s*/, '').trim().toLowerCase()
                              if (currentSec) existingMap.get(currentSec)!.add(b)
                              else looseBullets.add(b)
                            }
                          }

                          // Agrupa novos
                          const newMap = new Map<string, string[]>()
                          const newOrder: string[] = []
                          for (const it of list) {
                            const sec = it.section ? it.section[1] : 'Sem seção'
                            const instr = (it.instruction || '').trim()
                            if (!instr) continue
                            const key = instr.toLowerCase()
                            // Já presente em qualquer seção do texto? pula
                            const already =
                              looseBullets.has(key) ||
                              Array.from(existingMap.values()).some((s) => s.has(key))
                            if (already) continue
                            if (!newMap.has(sec)) { newMap.set(sec, []); newOrder.push(sec) }
                            newMap.get(sec)!.push(`- ${instr}`)
                          }

                          // Se nada novo, mantém existente
                          const hasNew = Array.from(newMap.values()).some((b) => b.length > 0)
                          if (!hasNew) return existing || ''

                          const existingTrimmed = (existing || '').replace(/\s+$/, '')
                          const appendix = newOrder
                            .map((sec) => `## ${sec} ##\n${newMap.get(sec)!.join('\n')}`)
                            .join('\n\n')
                          return existingTrimmed
                            ? `${existingTrimmed}\n\n${appendix}`
                            : appendix
                        }

                        // fault_description: só seta se ainda não contém o texto gerado
                        const currentFault = (getValues('fault_description') || '').trim()
                        if (!currentFault.toLowerCase().includes(fault.toLowerCase())) {
                          const newFault = currentFault ? `${currentFault}\n${fault}` : fault
                          setValue('fault_description', newFault, { shouldValidate: true })
                        }

                        // service_summary: merge sem duplicar; só verificados entram
                        const currentSummary = (getValues('service_summary') || '')
                        const mergedSummary = chosen.length > 0
                          ? mergeSectioned(currentSummary, chosen)
                          : currentSummary
                        setValue('service_summary', mergedSummary, { shouldValidate: true })

                        // pendency: merge sem duplicar
                        let addedPendencies = 0
                        if (excluded.length > 0) {
                          const currentPendency = getValues('pendency') || ''
                          const mergedPendency = mergeSectioned(currentPendency, excluded)
                          if (mergedPendency !== currentPendency) addedPendencies = excluded.length
                          setValue('pendency', mergedPendency, { shouldValidate: true })
                        }
                        toast.success(
                          addedPendencies > 0
                            ? `Preenchido · ${addedPendencies} pendência${addedPendencies === 1 ? '' : 's'}`
                            : 'Preenchimento automático aplicado'
                        )
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30 text-neon-purple hover:border-neon-purple/50 hover:bg-neon-purple/15 transition-all"
                    >
                      <Wand2 size={12} />
                      Preenchimento automático (Preventiva)
                    </button>
                  )}

                <Field label="Descrição da Falha" required error={errors.fault_description?.message}>
                  <textarea {...register('fault_description')} rows={3} className={inputClass(!!errors.fault_description)} />
                </Field>

                <Field label="Resumo do Serviço" required error={errors.service_summary?.message}>
                  <textarea {...register('service_summary')} rows={3} className={inputClass(!!errors.service_summary)} />
                </Field>

                <Field label="Observações">
                  <textarea {...register('observations')} rows={2} className={inputClass(false)} />
                </Field>

                <Field label="Pendências">
                  <textarea {...register('pendency')} rows={2} className={inputClass(false)} />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <AnimatedButton variant="ghost" type="button" onClick={onClose} disabled={isPending}>
                    Cancelar
                  </AnimatedButton>
                  <ActionButton type="submit" variant="neon" pending={isPending} loadingText="Salvando...">
                    {isEditing ? 'Salvar' : 'Criar Relatório'}
                  </ActionButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

const BASE_INPUT =
  'w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border text-white placeholder:text-white/30 focus:outline-none transition-colors'

function inputClass(hasError: boolean): string {
  return clsx(
    BASE_INPUT,
    hasError
      ? 'border-neon-pink/60 focus:border-neon-pink field-error-glow'
      : 'border-white/10 focus:border-neon-blue/40'
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-neon-pink/80">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-neon-pink mt-1 animate-pulse">{error}</p>}
    </div>
  )
}

function TechnicianPicker({
  value,
  onChange,
  employees,
  hasError,
}: {
  value: number[]
  onChange: (v: number[]) => void
  employees: { id: number; name: string; display_name?: string }[]
  hasError?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = employees.filter((e) => value.includes(e.id))
  const q = query.trim().toLowerCase()
  const filtered = employees
    .filter((e) => !value.includes(e.id))
    .filter((e) => !q || (e.name || '').toLowerCase().includes(q) || (e.display_name || '').toLowerCase().includes(q))
    .slice(0, 50)

  const add = (id: number) => {
    onChange([...value, id])
    setQuery('')
  }
  const remove = (id: number) => onChange(value.filter((v) => v !== id))

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs bg-neon-blue/10 border border-neon-blue/30 text-neon-blue"
            >
              <User size={10} />
              {e.name}
              <button
                type="button"
                onClick={() => remove(e.id)}
                className="p-0.5 rounded hover:bg-neon-blue/20 transition-colors"
                aria-label={`Remover ${e.name}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar técnico..."
          className={clsx(
            'w-full pl-8 pr-3 py-2 rounded-xl text-sm bg-white/[0.04] border text-white placeholder:text-white/30 focus:outline-none transition-colors',
            hasError
              ? 'border-neon-pink/60 focus:border-neon-pink field-error-glow'
              : 'border-white/10 focus:border-neon-blue/40'
          )}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-dark-800 border border-white/10 shadow-lg">
            {filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onMouseDown={(ev) => { ev.preventDefault(); add(e.id) }}
                className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-neon-blue/10 hover:text-neon-blue transition-colors flex items-center gap-2"
              >
                <User size={11} className="text-white/40" />
                {e.name}
              </button>
            ))}
          </div>
        )}
        {open && filtered.length === 0 && query && (
          <div className="absolute z-10 mt-1 w-full rounded-xl bg-dark-800 border border-white/10 p-3 text-xs text-white/40 text-center">
            Nenhum técnico encontrado
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistField({
  osId,
  items,
  included,
  onChange,
  currentRelatorioId,
}: {
  osId: number
  items: OsChecklistItem[]
  included: number[]
  onChange: (ids: number[]) => void
  currentRelatorioId?: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Items disponíveis (não travados por outro relatório)
  const availableItems = items.filter((it) => {
    if (included.includes(it.id)) return true
    if (currentRelatorioId && it.relatorio_id && it.relatorio_id[0] === currentRelatorioId) return true
    if (it.check && it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
    if (it.relatorio_id && it.relatorio_id[0] !== currentRelatorioId) return false
    return true
  })

  const handleOpen = async () => {
    if (loading) return
    setLoading(true)
    const t = toast.loading('Adicionando checklists ao relatório...')
    // Auto-inclui todos os disponíveis que ainda não estão na lista
    const merged = Array.from(new Set([...included, ...availableItems.map((i) => i.id)]))
    onChange(merged)
    // Pequeno delay pra transmitir ao usuário o processo
    await new Promise((r) => setTimeout(r, 400))
    toast.dismiss(t)
    setLoading(false)
    setOpen(true)
  }

  const groups = new Map<string, OsChecklistItem[]>()
  for (const it of availableItems) {
    const key = it.section ? it.section[1] : 'Sem seção'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(it)
  }

  return (
    <div>
      <label className="text-xs text-white/50 mb-2 flex items-center gap-1.5">
        <ClipboardList size={12} className="text-neon-blue" />
        <span>Itens do Check-list</span>
        <span className="text-[10px] text-white/30 ml-auto">
          {included.length} / {availableItems.length} incluídos
        </span>
      </label>

      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-neon-blue/30 transition-all text-left disabled:opacity-60"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCheck size={13} className="text-neon-blue/70 flex-shrink-0" />
          <span className="text-sm text-white/80 truncate">
            {loading ? 'Adicionando...' : 'Check-list'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
          {Array.from(groups.entries()).slice(0, 4).map(([name, its]) => {
            const inc = its.filter((i) => included.includes(i.id)).length
            return (
              <span
                key={name}
                className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-md border',
                  inc > 0
                    ? 'text-neon-blue bg-neon-blue/10 border-neon-blue/30'
                    : 'text-white/40 bg-white/5 border-white/10'
                )}
              >
                {name} {inc}/{its.length}
              </span>
            )
          })}
          {groups.size > 4 && (
            <span className="text-[10px] text-white/40">+{groups.size - 4}</span>
          )}
        </div>
      </button>

      <ChecklistManagerModal
        open={open}
        onClose={() => setOpen(false)}
        osId={osId}
        items={items}
        included={included}
        onChange={onChange}
        currentRelatorioId={currentRelatorioId}
      />
    </div>
  )
}
