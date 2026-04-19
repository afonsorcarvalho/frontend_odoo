'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCiclo } from '@/lib/hooks/useCiclos'
import { useCicloNavigation } from '@/lib/hooks/useCicloNavigation'
import { CycleDetail } from '@/components/ciclos/CycleDetail'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { useEffect } from 'react'
import { clsx } from 'clsx'

export default function CiclosDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const numericId = Number(id)
  const router = useRouter()
  const { data: cycle, isLoading, error } = useCiclo(numericId)

  const nav = useCicloNavigation(numericId)

  const goPrev = () => {
    if (nav.prevId !== null) router.push(`/ciclos/${nav.prevId}`)
  }
  const goNext = () => {
    if (nav.nextId !== null) router.push(`/ciclos/${nav.nextId}`)
  }

  // Atalhos de teclado: ← / →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignora quando usuário está digitando em input/textarea
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.prevId, nav.nextId])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/ciclos')}
            title="Voltar para lista"
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.span
                key={id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-white/70 truncate block"
              >
                {isLoading ? 'Carregando...' : cycle?.name ?? 'Ciclo'}
              </motion.span>
            </AnimatePresence>
            {nav.position !== null && nav.total > 0 && (
              <span className="text-[10px] text-white/30 font-mono">
                {nav.position} de {nav.loadedCount.toLocaleString('pt-BR')}
                {nav.hasMoreToLoad && ` (${nav.total.toLocaleString('pt-BR')} no total)`}
              </span>
            )}
          </div>

          <NavArrow
            direction="prev"
            disabled={nav.prevId === null}
            onClick={goPrev}
          />
          <NavArrow
            direction="next"
            disabled={nav.nextId === null}
            onClick={goNext}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="detail" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-white/40">
          Erro ao carregar ciclo.
        </div>
      ) : cycle ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={numericId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <CycleDetail cycle={cycle} />
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  )
}

function NavArrow({
  direction, disabled, onClick,
}: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  const isPrev = direction === 'prev'
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      disabled={disabled}
      onClick={onClick}
      title={
        disabled
          ? 'Sem ciclos disponíveis (carregue mais na lista primeiro)'
          : (isPrev ? 'Ciclo anterior (←)' : 'Próximo ciclo (→)')
      }
      className={clsx(
        'p-2 rounded-xl border transition-all flex-shrink-0',
        disabled
          ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-neon-blue/10 hover:border-neon-blue/30'
      )}
    >
      {isPrev ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </motion.button>
  )
}
