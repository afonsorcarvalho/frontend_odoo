'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { Combobox } from '@/components/ui/Combobox'
import {
  useMaterialsCatalog,
  useAddMaterialLine,
  useUpdateMaterialLine,
} from '@/lib/hooks/useCiclos'
import { CYCLE_MATERIAL_UNIT_LABEL, type OdooCycleMaterial } from '@/lib/types/ciclo'

interface MaterialEditModalProps {
  open: boolean
  onClose: () => void
  cycleId: number
  editing?: OdooCycleMaterial | null
}

const schema = z.object({
  material_id: z.number().int().positive('Selecione um material'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  unidade: z.enum(['caixa', 'unidade', 'pacote', 'envelope', 'kit', 'outro']),
  lote: z.string().optional(),
  fabricante_id: z.number().optional(),
  validade: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function MaterialEditModal({ open, onClose, cycleId, editing }: MaterialEditModalProps) {
  const { data: catalog } = useMaterialsCatalog()
  const addMutation = useAddMaterialLine(cycleId, onClose)
  const updateMutation = useUpdateMaterialLine(cycleId, onClose)

  const isEditing = !!editing

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      material_id: 0,
      quantidade: 1,
      unidade: 'unidade',
      lote: '',
      fabricante_id: undefined,
      validade: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          material_id: editing.material_id ? editing.material_id[0] : 0,
          quantidade: editing.quantidade !== false ? Number(editing.quantidade) : 1,
          unidade: editing.unidade || 'unidade',
          lote: editing.lote || '',
          fabricante_id: editing.fabricante_id ? editing.fabricante_id[0] : undefined,
          validade: editing.validade || '',
        })
      } else {
        reset({ material_id: 0, quantidade: 1, unidade: 'unidade', lote: '', fabricante_id: undefined, validade: '' })
      }
    }
  }, [open, editing, reset])

  const selectedMaterialId = watch('material_id')

  useEffect(() => {
    if (!selectedMaterialId || !catalog) return
    const mat = catalog.find((m) => m.id === selectedMaterialId)
    if (mat?.fabricante_id) {
      setValue('fabricante_id', mat.fabricante_id[0])
    } else {
      setValue('fabricante_id', undefined)
    }
  }, [selectedMaterialId, catalog, setValue])

  const onSubmit = (values: FormValues) => {
    const payload = {
      material_id: values.material_id,
      quantidade: values.quantidade,
      unidade: values.unidade,
      lote: values.lote || false,
      fabricante_id: values.fabricante_id || false,
      validade: values.validade || false,
    } as const

    if (isEditing) {
      updateMutation.mutate({ lineId: editing!.id, data: payload })
    } else {
      addMutation.mutate(payload)
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending || isSubmitting

  const selectedFabricanteId = watch('fabricante_id')
  const selectedMat = catalog?.find((m) => m.id === selectedMaterialId)
  const fabricanteLabel = selectedFabricanteId
    ? (catalog?.find((m) => m.id === selectedMaterialId)?.fabricante_nome || (selectedMat?.fabricante_id ? selectedMat.fabricante_id[1] : ''))
    : ''

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="mat-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full max-w-lg pointer-events-auto rounded-2xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />

              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-neon-blue" />
                  <h2 className="text-white font-semibold">
                    {isEditing ? 'Editar Material' : 'Adicionar Material'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Field label="Material *" error={errors.material_id?.message}>
                  <Combobox
                    options={catalog?.map((m) => ({
                      value: String(m.id),
                      label: m.descricao,
                      sublabel: m.fabricante_nome
                        ? String(m.fabricante_nome)
                        : m.fabricante_id ? m.fabricante_id[1] : undefined,
                    })) ?? []}
                    value={selectedMaterialId ? String(selectedMaterialId) : ''}
                    onChange={(v) => setValue('material_id', v ? Number(v) : 0, { shouldValidate: true })}
                    placeholder="Selecione um material..."
                    emptyLabel="— Nenhum —"
                  />
                </Field>

                {fabricanteLabel && (
                  <p className="text-xs text-white/40 -mt-2 px-1">Fabricante: {fabricanteLabel}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Quantidade *" error={errors.quantidade?.message}>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      {...register('quantidade', { valueAsNumber: true })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Unidade *" error={errors.unidade?.message}>
                    <select {...register('unidade')} className={inputCls}>
                      {(Object.keys(CYCLE_MATERIAL_UNIT_LABEL) as Array<keyof typeof CYCLE_MATERIAL_UNIT_LABEL>).map((u) => (
                        <option key={u} value={u} className="bg-dark-800">
                          {CYCLE_MATERIAL_UNIT_LABEL[u]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Lote">
                    <input {...register('lote')} className={inputCls} placeholder="Nº do lote" />
                  </Field>
                  <Field label="Validade">
                    <input type="date" {...register('validade')} className={inputCls} />
                  </Field>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <AnimatedButton variant="ghost" type="button" onClick={onClose} disabled={isPending}>
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton type="submit" disabled={isPending}>
                    {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
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
