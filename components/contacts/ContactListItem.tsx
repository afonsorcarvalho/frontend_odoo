'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { NeonBadge } from '@/components/ui/NeonBadge'
import { CardLoadingOverlay } from '@/components/ui/CardLoadingOverlay'
import { useContactsStore } from '@/lib/store/contactsStore'
import { useCardNavigation } from '@/lib/hooks/useCardNavigation'
import type { OdooPartnerSummary } from '@/lib/types/partner'
import { clsx } from 'clsx'

interface ContactListItemProps {
  contact: OdooPartnerSummary
  index?: number
}

export function ContactListItem({ contact, index = 0 }: ContactListItemProps) {
  const loadingDetailId = useContactsStore((s) => s.loadingDetailId)
  const setLoadingDetailId = useContactsStore((s) => s.setLoadingDetailId)
  const { navigate, isLoadingId } = useCardNavigation({
    loadingId: loadingDetailId,
    setLoadingId: setLoadingDetailId,
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 260, damping: 22 }}
      layout
    >
      <div
        onClick={() => navigate(contact.id, `/contacts/${contact.id}`)}
        className={clsx(
          'group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer',
          'border border-white/[0.06] bg-white/[0.02]',
          'hover:bg-white/[0.05] hover:border-white/10',
          'transition-all duration-200'
        )}
      >
        <CardLoadingOverlay isLoading={isLoadingId(contact.id)} />
        <Avatar
          src={contact.image_128}
          name={contact.name}
          isCompany={contact.is_company}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-white text-sm truncate">{contact.name}</span>
            <NeonBadge color={contact.is_company ? 'purple' : 'blue'} size="sm">
              {contact.is_company ? 'Empresa' : 'Pessoa'}
            </NeonBadge>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            {contact.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail size={10} className="text-neon-blue/50 flex-shrink-0" />
                <span className="truncate">{contact.email as string}</span>
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1 hidden sm:flex">
                <Phone size={10} className="text-neon-blue/50" />
                {contact.phone as string}
              </span>
            )}
            {contact.city && (
              <span className="flex items-center gap-1 hidden md:flex">
                <MapPin size={10} className="text-neon-blue/50" />
                {contact.city}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className="text-white/20 group-hover:text-neon-blue transition-colors flex-shrink-0"
        />
      </div>
    </motion.div>
  )
}
