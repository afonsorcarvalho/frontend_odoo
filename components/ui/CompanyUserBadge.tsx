'use client'

import { motion } from 'framer-motion'
import { Building2, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'

interface CompanyUserBadgeProps {
  onLogout: () => void
}

export function CompanyUserBadge({ onLogout }: CompanyUserBadgeProps) {
  const { userName, companyName, companyLogo } = useAuthStore()

  if (!userName && !companyName) return null

  return (
    <div className="flex items-center gap-3 ml-2 pl-2 border-l border-white/10">
      {(companyName || companyLogo) && (
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 min-w-0"
        >
          <CompanyLogo logo={companyLogo} name={companyName} />
          {companyName && (
            <span className="hidden md:block text-xs text-white/70 truncate max-w-[140px] font-medium">
              {companyName}
            </span>
          )}
        </motion.div>
      )}

      {userName && (
        <span className="hidden sm:block text-xs text-white/40 truncate max-w-[120px]">
          {userName}
        </span>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLogout}
        title="Sair"
        className="p-2 rounded-xl text-white/30 hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
      >
        <LogOut size={15} />
      </motion.button>
    </div>
  )
}

function CompanyLogo({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    return (
      <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo}`}
          alt={name || 'Logo da empresa'}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-lg border border-white/10 bg-neon-blue/10 flex items-center justify-center flex-shrink-0">
      <Building2 size={13} className="text-neon-blue/70" />
    </div>
  )
}
