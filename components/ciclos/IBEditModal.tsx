'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Beaker, Plus } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { Combobox } from '@/components/ui/Combobox'
import { useIBLotes, useUpdateCicloIB, useCreateIBLote } from '@/lib/hooks/useCiclos'
import type { OdooCycle } from '@/lib/types/ciclo'

interface IBEditModalProps {
  open: boolean
  onClose: () => void
  cycle: OdooCycle
}

interface MainFormValues {
  ib_lote: string
  ib_resultado: string
  ib_data_inicio: string
  ib_data_fim: string
}

interface NewLoteValues {
  name: string
  marca: string
  modelo: string
  data_validade: string
}

function toInputDateTime(odoo: string | false | null | undefined): string {
  if (!odoo || typeof odoo !== 'string') return ''
  const d = new Date(odoo.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function toOdooDateTime(local: string): string | false {
  if (!local) return false
  const d = new Date(local)
  if (isNaN(d.getTime())) return false
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`
}

export function IBEditModal({ open, onClose, cycle }: IBEditModalProps) {
  const { data: ibLotes } = useIBLotes()
  const [showNewLote, setShowNewLote] = useState(false)

  const mainForm = useForm<MainFormValues>({
    defaultValues: {
      ib_lote: cycle.ib_lote ? String(cycle.ib_lote[0]) : '',
      ib_resultado: cycle.ib_resultado || '',
      ib_data_inicio: toInputDateTime(cycle.ib_data_inicio),
      ib_data_fim: toInputDateTime(cycle.ib_data_fim),
    },
  })

  const newLoteForm = useForm<NewLoteValues>({
    defaultValues: { name: '', marca: '', modelo: '', data_validade: '' },
  })

  const saveMutation = useUpdateCicloIB(cycle.id, onClose)

  const createLoteMutation = useCreateIBLote((newId) => {
    mainForm.setValue('ib_lote', String(newId))
    newLoteForm.reset({ name: '', marca: '', modelo: '', data_validade: '' })
    setShowNewLote(false)
  })

  useEffect(() => {
    if (open) {
      mainForm.reset({
        ib_lote: cycle.ib_lote ? String(cycle.ib_lote[0]) : '',
        ib_resultado: cycle.ib_resultado || '',
        ib_data_inicio: toInputDateTime(cycle.ib_data_inicio),
        ib_data_fim: toInputDateTime(cycle.ib_data_fim),
      })
      newLoteForm.reset({ name: '', marca: '', modelo: '', data_validade: '' })
      setShowNewLote(false)
    }
  }, [open, cycle, mainForm, newLoteForm])

  const onSubmitMain = (values: MainFormValues) => {
    saveMutation.mutate({
      ib_lote: values.ib_lote ? Number(values.ib_lote) : false,
      ib_resultado: (values.ib_resultado as 'positivo' | 'negativo') || false,
      ib_data_inicio: toOdooDateTime(values.ib_data_inicio),
      ib_data_fim: toOdooDateTime(values.ib_data_fim),
    })
  }

  const onSubmitNewLote = (values: NewLoteValues) => {
    if (!values.name.trim() || !values.marca.trim()) return
    createLoteMutation.mutate({
      name: values.name.trim(),
      marca: values.marca.trim(),
      modelo: values.modelo.trim() || undefined,
      data_validade: values.data_validade || undefined,
    })
  }

  const isSaving = saveMutation.isPending || mainForm.formState.isSubmitting
  const isCreatingLote = createLoteMutation.isPending

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ib-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="ib-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto rounded-2xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />

              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Beaker size={16} className="text-neon-blue" />
                  <h2 className="text-white font-semibold">Editar Indicador Biológico</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Seletor de lote */}
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Lote do IB</label>
                  <div className="flex gap-2">
                    <Combobox
                      options={ibLotes?.map((lot) => ({
                        value: String(lot.id),
                        label: lot.name,
                        sublabel: [lot.marca || '', lot.modelo || ''].filter(Boolean).join(' · ') || undefined,
                        warn: lot.vencido ? '⚠ vencido' : undefined,
                      })) ?? []}
                      value={mainForm.watch('ib_lote')}
                      onChange={(v) => mainForm.setValue('ib_lote', v)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewLote((v) => !v)}
                      title="Cadastrar novo lote"
                      className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                        showNewLote
                          ? 'border-neon-blue/60 bg-neon-blue/20 text-neon-blue'
                          : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-neon-blue/40 hover:bg-neon-blue/10 hover:text-neon-blue'
                      }`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* Sub-formulário novo lote */}
                <AnimatePresence>
                  {showNewLote && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <form
                        onSubmit={newLoteForm.handleSubmit(onSubmitNewLote)}
                        className="rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4 space-y-3"
                      >
                        <p className="text-xs font-semibold text-neon-blue">Cadastrar novo lote</p>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Lote *">
                            <input
                              {...newLoteForm.register('name', { required: true })}
                              className={inputCls}
                              placeholder="Nº do lote"
                            />
                          </Field>
                          <Field label="Marca *">
                            <input
                              {...newLoteForm.register('marca', { required: true })}
                              className={inputCls}
                              placeholder="Fabricante"
                            />
                          </Field>
                          <Field label="Modelo">
                            <input
                              {...newLoteForm.register('modelo')}
                              className={inputCls}
                              placeholder="Referência"
                            />
                          </Field>
                          <Field label="Validade">
                            <input
                              type="date"
                              {...newLoteForm.register('data_validade')}
                              className={inputCls}
                            />
                          </Field>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setShowNewLote(false); newLoteForm.reset() }}
                            className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isCreatingLote}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neon-blue border border-neon-blue/30 bg-neon-blue/10 hover:bg-neon-blue/20 transition-all disabled:opacity-50"
                          >
                            {isCreatingLote ? 'Criando...' : 'Criar lote'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Resto do formulário principal */}
                <form onSubmit={mainForm.handleSubmit(onSubmitMain)} className="space-y-4">
                  <Field label="Resultado">
                    <select {...mainForm.register('ib_resultado')} className={inputCls}>
                      <option value="" className="bg-dark-800">— Não registado —</option>
                      <option value="negativo" className="bg-dark-800">Negativo</option>
                      <option value="positivo" className="bg-dark-800">Positivo</option>
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Início da incubação">
                      <input type="datetime-local" {...mainForm.register('ib_data_inicio')} className={inputCls} />
                    </Field>
                    <Field label="Fim da incubação">
                      <input type="datetime-local" {...mainForm.register('ib_data_fim')} className={inputCls} />
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <AnimatedButton variant="ghost" type="button" onClick={onClose} disabled={isSaving}>
                      Cancelar
                    </AnimatedButton>
                    <AnimatedButton type="submit" disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
