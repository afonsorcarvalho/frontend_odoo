'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'neon' | 'ghost' | 'danger' | 'secondary'
  icon?: ReactNode
  glow?: boolean
  loading?: boolean
}

const variants = {
  neon: 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue/50',
  ghost: 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white',
  danger: 'bg-neon-pink/10 border border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20',
  secondary: 'bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20',
}

export function AnimatedButton({
  children,
  variant = 'ghost',
  icon,
  glow = false,
  loading = false,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  )
}
