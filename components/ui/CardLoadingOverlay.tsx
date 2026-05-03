'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface CardLoadingOverlayProps {
  isLoading: boolean
}

/**
 * Overlay padrão de carregamento para cards de lista que navegam para detalhe.
 * Renderizado dentro do card (que precisa ter `position: relative`).
 * Cobre todo o card com blur leve, borda neon animada e spinner pequeno no
 * canto superior direito. `pointer-events-none` para não bloquear o clique
 * original enquanto a navegação acontece.
 */
export function CardLoadingOverlay({ isLoading }: CardLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-20 rounded-[inherit] bg-dark-900/55 backdrop-blur-[1px] pointer-events-none overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[inherit] border-2 border-neon-blue/60 animate-pulse" />
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark-800/90 border border-neon-blue/40 flex items-center justify-center shadow-glow-sm">
            <Loader2 size={14} className="text-neon-blue animate-spin" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
