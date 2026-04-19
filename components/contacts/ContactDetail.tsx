'use client'

import { motion } from 'framer-motion'
import {
  Mail, Phone, Smartphone, Globe, MapPin, Building2,
  Tag, FileText, Edit2, Archive, Calendar, Hash,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { NeonBadge } from '@/components/ui/NeonBadge'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { useContactsStore } from '@/lib/store/contactsStore'
import { useArchiveContact } from '@/lib/hooks/useContacts'
import type { OdooPartner } from '@/lib/types/partner'

interface ContactDetailProps {
  partner: OdooPartner
}

export function ContactDetail({ partner }: ContactDetailProps) {
  const router = useRouter()
  const { openFormModal } = useContactsStore()
  const archiveMutation = useArchiveContact()

  const handleArchive = async () => {
    if (confirm('Arquivar este contato?')) {
      await archiveMutation.mutateAsync(partner.id)
      router.push('/contacts')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <GlassCard variant="elevated" noPadding className="p-8">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon-blue/5 to-transparent rounded-t-2xl" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              src={partner.image_1920}
              name={partner.name}
              isCompany={partner.is_company}
              size="xl"
              glowing
            />

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{partner.name}</h1>
                <NeonBadge color={partner.is_company ? 'purple' : 'blue'} dot>
                  {partner.is_company ? 'Empresa' : 'Pessoa'}
                </NeonBadge>
              </div>

              {partner.company_id && !partner.is_company && (
                <p className="text-white/50 text-sm flex items-center gap-1.5 justify-center sm:justify-start mb-4">
                  <Building2 size={14} className="text-neon-blue/60" />
                  {partner.company_id[1]}
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <AnimatedButton
                  variant="neon"
                  icon={<Edit2 size={14} />}
                  glow
                  onClick={() => openFormModal(partner.id)}
                >
                  Editar
                </AnimatedButton>
                <AnimatedButton
                  variant="ghost"
                  icon={<Archive size={14} />}
                  onClick={handleArchive}
                  loading={archiveMutation.isPending}
                >
                  Arquivar
                </AnimatedButton>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
        >
          <GlassCard>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Contato
            </h2>
            <div className="space-y-3">
              {partner.email && (
                <InfoItem
                  icon={<Mail size={14} />}
                  label="E-mail"
                  value={partner.email as string}
                  href={`mailto:${partner.email}`}
                />
              )}
              {partner.phone && (
                <InfoItem
                  icon={<Phone size={14} />}
                  label="Telefone"
                  value={partner.phone as string}
                  href={`tel:${partner.phone}`}
                />
              )}
              {partner.mobile && (
                <InfoItem
                  icon={<Smartphone size={14} />}
                  label="Celular"
                  value={partner.mobile as string}
                  href={`tel:${partner.mobile}`}
                />
              )}
              {partner.website && (
                <InfoItem
                  icon={<Globe size={14} />}
                  label="Website"
                  value={partner.website as string}
                  href={partner.website as string}
                  external
                />
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
        >
          <GlassCard>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Endereço
            </h2>
            <div className="space-y-3">
              {(partner.street || partner.street2) && (
                <InfoItem
                  icon={<MapPin size={14} />}
                  label="Endereço"
                  value={[partner.street, partner.street2].filter(Boolean).join(', ')}
                />
              )}
              {(partner.city || partner.zip) && (
                <InfoItem
                  icon={<MapPin size={14} />}
                  label="Cidade / CEP"
                  value={[partner.city, partner.zip].filter(Boolean).join(' — ')}
                />
              )}
              {partner.country_id && (
                <InfoItem
                  icon={<Globe size={14} />}
                  label="País"
                  value={partner.country_id[1]}
                />
              )}
            </div>
          </GlassCard>
        </motion.div>

        {(partner.vat || partner.ref) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
          >
            <GlassCard>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                Fiscal
              </h2>
              <div className="space-y-3">
                {partner.vat && (
                  <InfoItem icon={<Hash size={14} />} label="CNPJ / CPF" value={partner.vat as string} />
                )}
                {partner.ref && (
                  <InfoItem icon={<Tag size={14} />} label="Referência interna" value={partner.ref as string} />
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {partner.comment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 22 }}
          >
            <GlassCard>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                Notas internas
              </h2>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                {partner.comment as string}
              </p>
            </GlassCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
          className="md:col-span-2"
        >
          <GlassCard>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              Registro
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-neon-blue/50" />
                <span>Criado em {new Date(partner.create_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-neon-blue/50" />
                <span>Atualizado em {new Date(partner.write_date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <ContactFormModal />
    </div>
  )
}

function InfoItem({
  icon, label, value, href, external,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  const content = (
    <div className="flex items-start gap-3">
      <span className="text-neon-blue/60 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-white/40 mb-0.5">{label}</p>
        <p className="text-sm text-white/80 break-all">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="block hover:text-white transition-colors"
      >
        {content}
      </a>
    )
  }
  return content
}

function ContactFormModal() {
  const { ui, closeFormModal } = useContactsStore()
  const { isFormModalOpen, editingPartnerId } = ui

  if (!isFormModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeFormModal} />
      <div className="relative z-10 w-full max-w-2xl bg-dark-800/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <p className="text-white text-center">Modal de edição aqui (use ContactFormModal global)</p>
      </div>
    </div>
  )
}
