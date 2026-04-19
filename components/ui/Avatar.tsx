'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { clsx } from 'clsx'

interface AvatarProps {
  src?: string | false
  name: string
  isCompany?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glowing?: boolean
  className?: string
}

const sizes = {
  sm:  { container: 'w-8 h-8',   text: 'text-xs',  icon: 14 },
  md:  { container: 'w-10 h-10', text: 'text-sm',  icon: 18 },
  lg:  { container: 'w-14 h-14', text: 'text-lg',  icon: 24 },
  xl:  { container: 'w-24 h-24', text: 'text-3xl', icon: 40 },
}

const gradients = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-cyan-600',
  'from-orange-500 to-pink-600',
  'from-blue-500 to-purple-600',
  'from-rose-500 to-orange-600',
  'from-violet-500 to-cyan-600',
]

function getGradient(name: string) {
  return gradients[name.charCodeAt(0) % gradients.length]
}

export function Avatar({
  src,
  name,
  isCompany = false,
  size = 'md',
  glowing = false,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { container, text, icon } = sizes[size]
  const gradient = getGradient(name)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const showImage = src && !imgError

  return (
    <motion.div
      className={clsx(
        container,
        'relative rounded-full overflow-hidden flex-shrink-0',
        'ring-2 ring-white/10',
        glowing && 'shadow-glow-blue animate-pulse-glow',
        className
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {showImage ? (
        <img
          src={`data:image/png;base64,${src}`}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full flex items-center justify-center',
            'bg-gradient-to-br',
            gradient
          )}
        >
          {isCompany ? (
            <Building2 size={icon} className="text-white/90" />
          ) : (
            <span className={clsx(text, 'font-bold text-white')}>{initials}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
