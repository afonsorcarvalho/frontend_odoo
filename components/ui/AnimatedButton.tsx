'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { ReactNode, ButtonHTMLAttributes, useEffect, useState } from 'react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'neon' | 'ghost' | 'danger' | 'secondary'
  icon?: ReactNode
  glow?: boolean
  loading?: boolean
  /** Delay em ms antes de mostrar o spinner (evita flash em ações rápidas). Default: 400 */
  spinnerDelay?: number
}

const variants = {
  neon:      'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue/50',
  ghost:     'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white',
  danger:    'bg-neon-pink/10 border border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20',
  secondary: 'bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20',
}

export function AnimatedButton({
  children,
  variant = 'ghost',
  icon,
  glow = false,
  loading = false,
  spinnerDelay = 400,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    if (!loading) { setShowSpinner(false); return }
    const t = setTimeout(() => setShowSpinner(true), spinnerDelay)
    return () => clearTimeout(t)
  }, [loading, spinnerDelay])

  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.05, y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
        'transition-all duration-200 backdrop-blur-xl',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        glow && 'shadow-glow-sm',
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {showSpinner ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  )
}
