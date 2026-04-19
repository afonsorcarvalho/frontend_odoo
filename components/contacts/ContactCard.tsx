'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Building2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Avatar } from '@/components/ui/Avatar'
import { NeonBadge } from '@/components/ui/NeonBadge'
import type { OdooPartnerSummary } from '@/lib/types/partner'
import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface ContactCardProps {
  contact: OdooPartnerSummary
  index?: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export function ContactCard({ contact, index = 0 }: ContactCardProps) {
  const router = useRouter()

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
    >
      <GlassCard
        variant="hover"
        noPadding
        className="cursor-pointer group relative p-5 h-full"
        onClick={() => router.push(`/contacts/${contact.id}`)}
      >
        <div className="absolute top-3 right-3">
          <NeonBadge color={contact.is_company ? 'purple' : 'blue'} dot>
            {contact.is_company ? 'Empresa' : 'Pessoa'}
          </NeonBadge>
        </div>

        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <Avatar
            src={contact.image_128}
            name={contact.name}
            isCompany={contact.is_company}
            size="lg"
            className="mb-3"
          />

          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 pr-2">
            {contact.name}
          </h3>

          {contact.company_id && !contact.is_company && (
            <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
              <Building2 size={10} />
              {contact.company_id[1]}
            </p>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

        <div className="space-y-2">
          {contact.email && (
            <InfoRow icon={<Mail size={12} />} value={contact.email as string} href={`mailto:${contact.email}`} />
          )}
          {(contact.phone || contact.mobile) && (
            <InfoRow
              icon={<Phone size={12} />}
              value={(contact.phone || contact.mobile) as string}
              href={`tel:${contact.phone || contact.mobile}`}
            />
          )}
          {contact.city && (
            <InfoRow
              icon={<MapPin size={12} />}
              value={[contact.city, contact.country_id && contact.country_id[1]]
                .filter(Boolean)
                .join(', ')}
            />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-12 flex items-center justify-center bg-gradient-to-t from-neon-blue/10 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-neon-blue font-medium flex items-center gap-1">
            Ver detalhes <ExternalLink size={10} />
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function InfoRow({ icon, value, href }: { icon: ReactNode; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 text-xs text-white/60 hover:text-white/90 transition-colors truncate">
      <span className="text-neon-blue/70 flex-shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )

  if (href) {
    return (
      <a href={href} onClick={(e) => e.stopPropagation()} className="block">
        {content}
      </a>
    )
  }
  return content
}
