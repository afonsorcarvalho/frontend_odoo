'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PenTool, User, ShieldCheck, ChevronDown, Check } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { SignatureCapture } from '@/components/ui/SignatureCapture'
import osApi from '@/lib/odoo/os'
import { type OdooOs } from '@/lib/types/os'

type Slot = 'signature' | 'signature2'

interface OsSignMenuProps {
  os: OdooOs
}

export function OsSignMenu({ os }: OsSignMenuProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [pending, setPending] = useState(false)
  const queryClient = useQueryClient()

  const handleSave = async (slot: Slot, value: string | null) => {
    setPending(true)
    try {
      await osApi.update(os.id, { [slot]: value ?? false } as never)
      queryClient.invalidateQueries({ queryKey: ['os-detail', os.id] })
      queryClient.invalidateQueries({ queryKey: ['os'] })
      toast.success(value ? 'Assinatura salva!' : 'Assinatura removida.')
      setActiveSlot(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar assinatura')
    } finally {
      setPending(false)
    }
  }

  const options: Array<{ slot: Slot; label: string; icon: React.ReactNode; signed: boolean; defaultName: string }> = [
    {
      slot: 'signature',
      label: 'Técnico',
      icon: <User size={13} className="text-neon-blue/70 flex-shrink-0" />,
      signed: !!os.signature,
      defaultName: os.tecnico_id ? os.tecnico_id[1] : '',
    },
    {
      slot: 'signature2',
      label: 'Supervisor',
      icon: <ShieldCheck size={13} className="text-neon-purple/70 flex-shrink-0" />,
      signed: !!os.signature2,
      defaultName: '',
    },
  ]

  return (
    <>
      <DropdownMenu.Root open={openMenu} onOpenChange={setOpenMenu}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border border-neon-purple/30 text-white font-medium text-sm hover:border-neon-purple/50 shadow-glow-sm transition-all data-[state=open]:border-neon-purple/60"
          >
            <PenTool size={14} />
            Assinar
            <ChevronDown size={12} className="transition-transform data-[state=open]:rotate-180" />
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-[9999] min-w-[240px] rounded-xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent" />
            <div className="p-1">
              {options.map((opt) => (
                <DropdownMenu.Item
                  key={opt.slot}
                  onSelect={(e) => {
                    e.preventDefault()
                    setOpenMenu(false)
                    setActiveSlot(opt.slot)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/5 data-[highlighted]:bg-white/5 data-[highlighted]:text-white outline-none cursor-pointer transition-colors"
                >
                  {opt.icon}
                  <span className="flex-1">{opt.label}</span>
                  {opt.signed && (
                    <span className="flex items-center gap-1 text-[10px] text-neon-green">
                      <Check size={11} /> Assinado
                    </span>
                  )}
                </DropdownMenu.Item>
              ))}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <SignatureCapture
        open={activeSlot === 'signature'}
        onClose={() => setActiveSlot(null)}
        onSave={(v) => handleSave('signature', v)}
        title="Assinatura do Técnico"
        defaultName={os.tecnico_id ? os.tecnico_id[1] : ''}
        currentValue={os.signature || null}
        pending={pending}
      />
      <SignatureCapture
        open={activeSlot === 'signature2'}
        onClose={() => setActiveSlot(null)}
        onSave={(v) => handleSave('signature2', v)}
        title="Assinatura do Supervisor"
        defaultName=""
        currentValue={os.signature2 || null}
        pending={pending}
      />
    </>
  )
}
