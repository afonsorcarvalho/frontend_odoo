'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { PenTool, User, ShieldCheck, Pencil } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { SignatureCapture } from '@/components/ui/SignatureCapture'
import osApi from '@/lib/odoo/os'
import { OS_TERMINAL_STATES, type OdooOs } from '@/lib/types/os'
import { useOsPermissions } from '@/lib/hooks/useOsPermissions'

interface OsSignaturesSectionProps {
  os: OdooOs
}

type SlotKey = 'signature' | 'signature2'

export function OsSignaturesSection({ os }: OsSignaturesSectionProps) {
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null)
  const [pending, setPending] = useState(false)
  const queryClient = useQueryClient()
  const { canWriteOs } = useOsPermissions()

  const isTerminal = os.state ? OS_TERMINAL_STATES.includes(os.state as never) : false
  const canSign = canWriteOs && !isTerminal

  const handleSave = async (slot: SlotKey, value: string | null) => {
    setPending(true)
    try {
      await osApi.update(os.id, { [slot]: value ?? false } as never)
      queryClient.invalidateQueries({ queryKey: ['os-detail', os.id] })
      queryClient.invalidateQueries({ queryKey: ['os'] })
      toast.success(value ? 'Assinatura salva!' : 'Assinatura removida.')
      setOpenSlot(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar assinatura')
    } finally {
      setPending(false)
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <PenTool size={14} className="text-neon-blue" />
        <h3 className="text-sm font-semibold text-white">Assinaturas</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignatureSlot
          icon={<User size={13} />}
          label="Técnico"
          value={os.signature || null}
          date={os.technician_signature_date || null}
          canSign={canSign}
          onOpen={() => setOpenSlot('signature')}
        />
        <SignatureSlot
          icon={<ShieldCheck size={13} />}
          label="Supervisor"
          value={os.signature2 || null}
          date={os.supervisor_signature_date || null}
          canSign={canSign}
          onOpen={() => setOpenSlot('signature2')}
        />
      </div>

      <SignatureCapture
        open={openSlot === 'signature'}
        onClose={() => setOpenSlot(null)}
        onSave={(v) => handleSave('signature', v)}
        title="Assinatura do Técnico"
        defaultName={os.tecnico_id ? os.tecnico_id[1] : ''}
        currentValue={os.signature || null}
        pending={pending}
      />
      <SignatureCapture
        open={openSlot === 'signature2'}
        onClose={() => setOpenSlot(null)}
        onSave={(v) => handleSave('signature2', v)}
        title="Assinatura do Supervisor"
        defaultName=""
        currentValue={os.signature2 || null}
        pending={pending}
      />
    </GlassCard>
  )
}

function SignatureSlot({
  icon, label, value, date, canSign, onOpen,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  date: string | null
  canSign: boolean
  onOpen: () => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="text-neon-blue/70">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        {canSign && (
          <AnimatedButton variant="ghost" icon={<Pencil size={12} />} onClick={onOpen}>
            {value ? 'Trocar' : 'Assinar'}
          </AnimatedButton>
        )}
      </div>

      <div
        className={clsx(
          'min-h-[90px] flex items-center justify-center rounded-lg p-2 border',
          value ? 'bg-white border-white/20' : 'bg-white/[0.03] border-white/5'
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${value}`}
            alt={label}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <p className="text-xs text-white/30">Sem assinatura</p>
        )}
      </div>

      {date && (
        <p className="text-[10px] text-white/40 mt-2 text-center">
          Assinado em {fmt(date)}
        </p>
      )}
    </div>
  )
}

function fmt(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
