'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Building2, User } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { useCreateContact, useUpdateContact } from '@/lib/hooks/useContacts'
import { useCountries } from '@/lib/hooks/useContact'
import type { PartnerFormData } from '@/lib/types/partner'
import { clsx } from 'clsx'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  is_company: z.boolean(),
  website: z.string().url('URL inválida').or(z.literal('')).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country_id: z.number().optional(),
  vat: z.string().optional(),
  comment: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ContactFormProps {
  partnerId?: number | null
  initialData?: Partial<FormValues>
  onCancel: () => void
}

export function ContactForm({ partnerId, initialData, onCancel }: ContactFormProps) {
  const { data: countries } = useCountries()
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()

  const isEditing = !!partnerId

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_company: false,
      name: '',
      ...initialData,
    },
  })

  const isCompany = watch('is_company')

  const onSubmit = (data: FormValues) => {
    const payload: PartnerFormData = {
      ...data,
      name: data.name,
      is_company: data.is_company,
    }

    if (isEditing) {
      updateMutation.mutate({ id: partnerId!, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex gap-3">
        {[
          { value: false, label: 'Pessoa', icon: <User size={16} /> },
          { value: true, label: 'Empresa', icon: <Building2 size={16} /> },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => setValue('is_company', opt.value)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
              isCompany === opt.value
                ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome *" error={errors.name?.message}>
          <input
            {...register('name')}
            placeholder={isCompany ? 'Nome da empresa' : 'Nome completo'}
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="E-mail" error={errors.email?.message}>
          <input {...register('email')} type="email" placeholder="email@exemplo.com" className={inputCls(!!errors.email)} />
        </Field>

        <Field label="Telefone">
          <input {...register('phone')} placeholder="+55 (11) 0000-0000" className={inputCls()} />
        </Field>

        <Field label="Celular">
          <input {...register('mobile')} placeholder="+55 (11) 90000-0000" className={inputCls()} />
        </Field>

        <Field label="Website" error={errors.website?.message}>
          <input {...register('website')} placeholder="https://exemplo.com" className={inputCls(!!errors.website)} />
        </Field>

        <Field label="CNPJ / CPF">
          <input {...register('vat')} placeholder="00.000.000/0000-00" className={inputCls()} />
        </Field>
      </div>

      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Endereço</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Rua / Endereço">
              <input {...register('street')} placeholder="Av. Paulista, 1000" className={inputCls()} />
            </Field>
          </div>

          <Field label="Cidade">
            <input {...register('city')} placeholder="São Paulo" className={inputCls()} />
          </Field>

          <Field label="CEP">
            <input {...register('zip')} placeholder="00000-000" className={inputCls()} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="País">
              <select {...register('country_id', { setValueAs: (v) => (v ? Number(v) : undefined) })} className={inputCls()}>
                <option value="" className="bg-dark-800">Selecionar país</option>
                {countries?.map((c) => (
                  <option key={c.id} value={c.id} className="bg-dark-800">{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <Field label="Observações internas">
        <textarea
          {...register('comment')}
          rows={3}
          placeholder="Notas internas sobre este contato..."
          className={clsx(inputCls(), 'resize-none')}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <AnimatedButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </AnimatedButton>
        <AnimatedButton
          type="submit"
          variant="neon"
          glow
          loading={isPending}
          className="flex-1"
        >
          {isEditing ? 'Salvar alterações' : 'Criar contato'}
        </AnimatedButton>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/60">{label}</label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-neon-pink"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

function inputCls(hasError?: boolean) {
  return clsx(
    'w-full px-3 py-2.5 rounded-xl text-sm',
    'bg-white/[0.04] border text-white placeholder-white/30',
    'focus:outline-none focus:bg-white/[0.06] transition-all',
    hasError
      ? 'border-neon-pink/40 focus:border-neon-pink/60'
      : 'border-white/10 focus:border-neon-blue/40'
  )
}
