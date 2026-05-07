'use client'

import { useState } from 'react'
import { Cpu } from 'lucide-react'
import { clsx } from 'clsx'

const SIZE = {
  sm: { outer: 'w-8 h-8',   icon: 10 },
  md: { outer: 'w-10 h-10', icon: 14 },
  lg: { outer: 'w-14 h-14', icon: 20 },
} as const

interface EquipmentAvatarProps {
  equipmentId: number
  size?: keyof typeof SIZE
  className?: string
}

export function EquipmentAvatar({ equipmentId, size = 'md', className }: EquipmentAvatarProps) {
  const [failed, setFailed] = useState(false)
  const { outer, icon } = SIZE[size]

  return (
    <div
      className={clsx(
        outer,
        'flex-shrink-0 rounded-xl overflow-hidden',
        'border border-white/10 bg-white/[0.04]',
        className,
      )}
    >
      {!failed ? (
        <img
          src={`/api/odoo/web/image/engc.equipment/${equipmentId}/image_1920`}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neon-blue/5">
          <Cpu size={icon} className="text-neon-blue/50" />
        </div>
      )}
    </div>
  )
}
