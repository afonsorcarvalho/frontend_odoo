'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { ActionButton } from '@/components/ui/ActionButton'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { useCreateOs, useUpdateOs, useEmployees, useDepartments, useOsEquipments, useOsDetail, usePartners } from '@/lib/hooks/useOs'
import {
  MAINTENANCE_TYPE_LABEL,
  OS_PRIORITY_LABEL,
  type OsFormData,
  type MaintenanceType,
  type OsPriority,
  type OsWhoExecutor,
  type OsWarrantyType,
} from '@/lib/types/os'
import { clsx } from 'clsx'

const schema = z.object({
  equipment_id: z.number().int().positive('Selecione um equipamento'),
  maintenance_type: z.enum([
    'corrective', 'preventive', 'instalacao', 'treinamento',
    'preditiva', 'qualification', 'loan', 'calibration',
  ]),
  priority: z.enum(['0', '1', '2', '3']),
  who_executor: z.enum(['3rd_party', 'own']),
  solicitante: z.string().min(1, 'Solicitante é obrigatório'),
  date_request: z.string().min(1, 'Data de requisição é obrigatória'),
  date_scheduled: z.string().min(1, 'Data programada é obrigatória'),
  maintenance_duration: z.number().optional(),
  is_warranty: z.boolean().optional(),
  warranty_type: z.enum(['servico', 'fabrica']).optional(),
  tecnico_id: z.number().optional(),
  tecnico_aux_id: z.number().optional(),
  department: z.number().optional(),
  empresa_manutencao: z.number().optional(),
  client_id: z.number().optional(),
  problem_description: z.string().optional(),
  service_description: z.string().optional(),
  origin: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface OsFormProps {
  osId?: number | null
  onCancel: () => void
}

function toOptions(list: { id: number; name: string; display_name?: string }[] | undefined): ComboboxOption[] {
  return (list || []).map((o) => ({ value: String(o.id), label: o.display_name || o.name }))
}

// Converte "YYYY-MM-DD HH:MM:SS" (Odoo, UTC) para "YYYY-MM-DDTHH:MM" (input datetime-local)
function toInputDateTime(iso: string | false | undefined): string {
  if (!iso || typeof iso !== 'string') return ''
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Converte "YYYY-MM-DDTHH:MM" (local) para "YYYY-MM-DD HH:MM:SS" UTC
function toOdooDateTime(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`
}

export function OsForm({ osId, onCancel }: OsFormProps) {
  const isEditing = !!osId
  const { data: existing, isLoading: loadingExisting } = useOsDetail(osId ?? null)
  const { data: equipments } = useOsEquipments()
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()
  const { data: companies } = usePartners('company')
  const { data: allPartners } = usePartners('all')

  const createMutation = useCreateOs()
  const updateMutation = useUpdateOs()

  const {
    register, handleSubmit, watch, reset, control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      equipment_id: 0,
      maintenance_type: 'corrective',
      priority: '0',
      who_executor: 'own',
      solicitante: '',
      date_request: '',
      date_scheduled: '',
      is_warranty: false,
    },
  })

  useEffect(() => {
    if (isEditing && existing) {
      reset({
        equipment_id: (existing.equipment_id && existing.equipment_id[0]) || 0,
        maintenance_type: (existing.maintenance_type || 'corrective') as MaintenanceType,
        priority: (existing.priority || '0') as OsPriority,
        who_executor: (existing.who_executor || 'own') as OsWhoExecutor,
        solicitante: existing.solicitante || '',
        date_request: toInputDateTime(existing.date_request),
        date_scheduled: toInputDateTime(existing.date_scheduled),
        maintenance_duration: existing.maintenance_duration || undefined,
        is_warranty: !!existing.is_warranty,
        warranty_type: (existing.warranty_type || undefined) as OsWarrantyType | undefined,
        tecnico_id: (existing.tecnico_id && existing.tecnico_id[0]) || undefined,
        tecnico_aux_id: (existing.tecnico_aux_id && existing.tecnico_aux_id[0]) || undefined,
        department: (existing.department && existing.department[0]) || undefined,
        empresa_manutencao: (existing.empresa_manutencao && existing.empresa_manutencao[0]) || undefined,
        client_id: (existing.client_id && existing.client_id[0]) || undefined,
        problem_description: existing.problem_description || '',
        service_description: existing.service_description || '',
        origin: existing.origin || '',
      })
    }
  }, [isEditing, existing, reset])

  const isWarranty = watch('is_warranty')

  const onSubmit = (data: FormValues) => {
    const payload: OsFormData = {
      equipment_id: data.equipment_id,
      maintenance_type: data.maintenance_type,
      priority: data.priority,
      who_executor: data.who_executor,
      solicitante: data.solicitante,
      date_request: toOdooDateTime(data.date_request),
      date_scheduled: toOdooDateTime(data.date_scheduled),
      maintenance_duration: data.maintenance_duration,
      is_warranty: data.is_warranty,
      warranty_type: data.warranty_type,
      tecnico_id: data.tecnico_id,
      tecnico_aux_id: data.tecnico_aux_id,
      department: data.department,
      empresa_manutencao: data.empresa_manutencao,
      client_id: data.client_id,
      problem_description: data.problem_description,
      service_description: data.service_description,
      origin: data.origin,
    }
    // Remove undefined/vazios
    const rec = payload as unknown as Record<string, unknown>
    Object.keys(rec).forEach((k) => {
      if (rec[k] === undefined || rec[k] === '') {
        delete rec[k]
      }
    })

    if (isEditing) {
      updateMutation.mutate({ id: osId!, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting

  if (isEditing && loadingExisting) {
    return <p className="text-sm text-white/50">Carregando dados da OS...</p>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Equipamento *" error={errors.equipment_id?.message}>
          <Controller
            name="equipment_id"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : 0)}
                options={toOptions(equipments)}
                placeholder="Buscar equipamento..."
              />
            )}
          />
        </Field>

        <Field label="Tipo de Manutenção *" error={errors.maintenance_type?.message}>
          <select {...register('maintenance_type')} className={inputCls}>
            {(Object.keys(MAINTENANCE_TYPE_LABEL) as MaintenanceType[]).map((t) => (
              <option key={t} value={t} className="bg-dark-800">
                {MAINTENANCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Prioridade *" error={errors.priority?.message}>
          <select {...register('priority')} className={inputCls}>
            {(Object.keys(OS_PRIORITY_LABEL) as OsPriority[]).map((p) => (
              <option key={p} value={p} className="bg-dark-800">
                {OS_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Executor *">
          <select {...register('who_executor')} className={inputCls}>
            <option value="own" className="bg-dark-800">Própria</option>
            <option value="3rd_party" className="bg-dark-800">Terceirizada</option>
          </select>
        </Field>

        <Field label="Solicitante *" error={errors.solicitante?.message}>
          <input {...register('solicitante')} className={inputCls} placeholder="Nome do solicitante" />
        </Field>

        <Field label="Duração estimada (h)">
          <input
            type="number"
            step="0.5"
            {...register('maintenance_duration', { valueAsNumber: true, setValueAs: (v) => v === '' || Number.isNaN(v) ? undefined : Number(v) })}
            className={inputCls}
          />
        </Field>

        <Field label="Data de Requisição *" error={errors.date_request?.message}>
          <input type="datetime-local" {...register('date_request')} className={inputCls} />
        </Field>

        <Field label="Data Programada *" error={errors.date_scheduled?.message}>
          <input type="datetime-local" {...register('date_scheduled')} className={inputCls} />
        </Field>

        <Field label="Técnico">
          <Controller
            name="tecnico_id"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                options={toOptions(employees)}
                placeholder="Buscar técnico..."
              />
            )}
          />
        </Field>

        <Field label="Técnico Auxiliar">
          <Controller
            name="tecnico_aux_id"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                options={toOptions(employees)}
                placeholder="Buscar técnico auxiliar..."
              />
            )}
          />
        </Field>

        <Field label="Departamento">
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                options={toOptions(departments)}
                placeholder="Buscar departamento..."
              />
            )}
          />
        </Field>

        <Field label="Empresa (terceirizada)">
          <Controller
            name="empresa_manutencao"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                options={toOptions(companies)}
                placeholder="Buscar empresa..."
              />
            )}
          />
        </Field>

        <Field label="Cliente">
          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ? String(field.value) : ''}
                onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                options={toOptions(allPartners)}
                placeholder="Buscar cliente..."
              />
            )}
          />
        </Field>

        <Field label="Origem">
          <input {...register('origin')} className={inputCls} placeholder="Documento de origem" />
        </Field>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" {...register('is_warranty')} className="accent-neon-blue" />
            Em garantia
          </label>
          {isWarranty && (
            <select {...register('warranty_type')} className={clsx(inputCls, 'flex-1')}>
              <option value="" className="bg-dark-800">Tipo...</option>
              <option value="servico" className="bg-dark-800">Serviço</option>
              <option value="fabrica" className="bg-dark-800">Fábrica</option>
            </select>
          )}
        </div>
      </div>

      <Field label="Descrição do Chamado">
        <textarea {...register('problem_description')} rows={3} className={inputCls} />
      </Field>

      <Field label="Descrição do Serviço">
        <textarea {...register('service_description')} rows={3} className={inputCls} />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
        <AnimatedButton variant="ghost" type="button" onClick={onCancel} disabled={isPending}>
          Cancelar
        </AnimatedButton>
        <ActionButton type="submit" variant="neon" pending={isPending} loadingText="Salvando...">
          {isEditing ? 'Salvar alterações' : 'Criar OS'}
        </ActionButton>
      </div>
    </form>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      {children}
      {error && <p className="text-[11px] text-neon-pink mt-1">{error}</p>}
    </div>
  )
}
