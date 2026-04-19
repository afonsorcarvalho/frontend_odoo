'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useContact } from '@/lib/hooks/useContact'
import { ContactDetail } from '@/components/contacts/ContactDetail'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ContactFormModal } from '@/components/contacts/ContactFormModal'

export default function ContactPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { data: partner, isLoading, error } = useContact(Number(id))

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/contacts')}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-white/50 text-sm">
            {isLoading ? 'Carregando...' : partner?.name ?? 'Contato'}
          </span>
        </div>
      </header>

      {isLoading ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="detail" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-white/40">
          Erro ao carregar contato.
        </div>
      ) : partner ? (
        <ContactDetail partner={partner} />
      ) : null}

      <ContactFormModal />
    </div>
  )
}
