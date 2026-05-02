'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, Wrench, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOsDetail } from '@/lib/hooks/useOs'
import { useOsStore } from '@/lib/store/osStore'
import { OsDetail } from '@/components/os/OsDetail'
import { OsFormModal } from '@/components/os/OsFormModal'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { GlassCard } from '@/components/ui/GlassCard'

export default function OsDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const numericId = Number(params.id)
  const { data: os, isLoading, error } = useOsDetail(numericId)
  const setLoadingDetailId = useOsStore((s) => s.setLoadingDetailId)

  // Limpa spinner global quando página detalhe monta ou termina de carregar
  useEffect(() => {
    if (!isLoading) setLoadingDetailId(null)
  }, [isLoading, setLoadingDetailId])

  // Também limpa ao desmontar (caso user volte)
  useEffect(() => {
    return () => setLoadingDetailId(null)
  }, [setLoadingDetailId])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 pl-12 md:pl-4">
          <AnimatedButton variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => router.push('/os')}>
            Voltar
          </AnimatedButton>
          <div className="flex items-center gap-2 text-white/60">
            <Wrench size={16} className="text-neon-blue/70" />
            <span className="text-sm">OS #{numericId}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <GlassCard className="p-10">
            <div className="flex flex-col items-center justify-center gap-3 text-white/70">
              <Loader2 size={28} className="animate-spin text-neon-blue" />
              <p className="text-sm font-medium">Carregando OS #{numericId}...</p>
              <p className="text-xs text-white/40">Buscando dados no servidor</p>
            </div>
          </GlassCard>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-white/50"
          >
            <p>Erro ao carregar: {(error as Error).message}</p>
          </motion.div>
        ) : os ? (
          <OsDetail os={os} />
        ) : null}
      </main>

      <OsFormModal />
    </div>
  )
}
