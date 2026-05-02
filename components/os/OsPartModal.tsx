'use client'

import { useState, useEffect } from 'react'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Search, Loader2 } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { ActionButton } from '@/components/ui/ActionButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { useCreatePart, useProducts } from '@/lib/hooks/useOs'
import type { OsProduct } from '@/lib/types/os'

const schema = z.object({
  product_id: z.number().int().positive('Selecione um produto'),
  product_uom_qty: z.number().positive('Quantidade deve ser maior que zero'),
})

type FormValues = z.infer<typeof schema>

interface OsPartModalProps {
  open: boolean
  onClose: () => void
  osId: number
  /** Se fornecido, a peça é solicitada vinculada a este relatório */
  relatorioId?: number
  /** Se true, a peça já é criada como aplicada neste relatório */
  asApplication?: boolean
}

export function OsPartModal({ open, onClose, osId, relatorioId, asApplication }: OsPartModalProps) {
  const createMutation = useCreatePart(osId)

  const {
    register, handleSubmit, reset, control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { product_id: 0, product_uom_qty: 1 },
  })

  useEffect(() => {
    if (open) {
      reset({ product_id: 0, product_uom_qty: 1 })
    }
  }, [open, reset])

  const onSubmit = (data: FormValues) => {
    const payload: {
      os_id: number; product_id: number; product_uom_qty: number
      relatorio_request_id?: number; relatorio_application_id?: number; state?: 'aplicada'
    } = {
      os_id: osId,
      product_id: data.product_id,
      product_uom_qty: data.product_uom_qty,
    }
    if (relatorioId) {
      if (asApplication) {
        payload.relatorio_application_id = relatorioId
        payload.state = 'aplicada'
      } else {
        payload.relatorio_request_id = relatorioId
      }
    }
    createMutation.mutate(payload as never, { onSuccess: onClose })
  }

  const isPending = createMutation.isPending || isSubmitting

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
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-neon-blue" />
                  <h2 className="text-base font-semibold text-white">Solicitar Peça</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 flex items-center gap-1">
                    <span>Produto</span>
                    <span className="text-neon-pink/80">*</span>
                  </label>
                  <Controller
                    name="product_id"
                    control={control}
                    render={({ field }) => (
                      <ProductPicker
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.product_id}
                      />
                    )}
                  />
                  {errors.product_id && (
                    <p className="text-[11px] text-neon-pink mt-1 animate-pulse">{errors.product_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1 flex items-center gap-1">
                    <span>Quantidade</span>
                    <span className="text-neon-pink/80">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    {...register('product_uom_qty', { valueAsNumber: true })}
                    className={clsx(
                      'w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border text-white focus:outline-none transition-colors',
                      errors.product_uom_qty
                        ? 'border-neon-pink/60 focus:border-neon-pink field-error-glow'
                        : 'border-white/10 focus:border-neon-blue/40'
                    )}
                  />
                  {errors.product_uom_qty && (
                    <p className="text-[11px] text-neon-pink mt-1 animate-pulse">{errors.product_uom_qty.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <AnimatedButton variant="ghost" type="button" onClick={onClose} disabled={isPending}>
                    Cancelar
                  </AnimatedButton>
                  <ActionButton type="submit" variant="neon" pending={isPending} loadingText="Solicitando...">
                    Solicitar Peça
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

function ProductPicker({
  value,
  onChange,
  hasError,
}: {
  value: number
  onChange: (v: number) => void
  hasError?: boolean
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<OsProduct | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: products, isFetching } = useProducts(debounced)

  // Reset selected quando value muda de fora (reset do form)
  useEffect(() => {
    if (!value) setSelected(null)
  }, [value])

  const pick = (p: OsProduct) => {
    setSelected(p)
    onChange(p.id)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    setSelected(null)
    onChange(0)
    setQuery('')
  }

  if (selected && value === selected.id) {
    return (
      <div
        className={clsx(
          'flex items-center justify-between px-3 py-2 rounded-xl text-sm bg-neon-blue/5 border',
          hasError ? 'border-neon-pink/60 field-error-glow' : 'border-neon-blue/30'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Package size={13} className="text-neon-blue flex-shrink-0" />
          <span className="text-white truncate">{selected.display_name || selected.name}</span>
          {selected.uom_id && (
            <span className="text-[10px] text-white/40 uppercase flex-shrink-0">
              {selected.uom_id[1]}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          className="p-1 rounded-lg text-white/40 hover:text-neon-pink hover:bg-neon-pink/10 transition-all flex-shrink-0"
          aria-label="Remover produto"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
      {isFetching && (
        <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Digite para buscar produto..."
        className={clsx(
          'w-full pl-8 pr-8 py-2 rounded-xl text-sm bg-white/[0.04] border text-white placeholder:text-white/30 focus:outline-none transition-colors',
          hasError
            ? 'border-neon-pink/60 focus:border-neon-pink field-error-glow'
            : 'border-white/10 focus:border-neon-blue/40'
        )}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl bg-dark-800 border border-white/10 shadow-lg">
          {products && products.length > 0 ? (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(ev) => { ev.preventDefault(); pick(p) }}
                className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-neon-blue/10 hover:text-neon-blue transition-colors flex items-center gap-2"
              >
                <Package size={11} className="text-white/40 flex-shrink-0" />
                <span className="truncate flex-1">{p.display_name || p.name}</span>
                {p.uom_id && (
                  <span className="text-[10px] text-white/40 uppercase flex-shrink-0">
                    {p.uom_id[1]}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-3 text-xs text-white/40 text-center">
              {isFetching ? 'Buscando...' : query ? 'Nenhum produto encontrado' : 'Digite para buscar'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
