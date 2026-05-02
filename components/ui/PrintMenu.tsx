'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Printer, FileText, FileDown, Loader2, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { getReportsFor, type OdooReport } from '@/lib/odoo/reports'

interface PrintMenuProps {
  model: string
  onOpenReport: (reportName: string, label: string, filenamePattern?: string) => void | Promise<void>
  label?: string
  size?: 'sm' | 'md'
  /** Predicate opcional para filtrar reports disponíveis (ex: depende de estado do registro) */
  filterReports?: (r: OdooReport) => boolean
}

export function PrintMenu({ model, onOpenReport, label = 'Imprimir', size = 'md', filterReports }: PrintMenuProps) {
  const [printing, setPrinting] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const allReports = getReportsFor(model)
  const reports = filterReports ? allReports.filter(filterReports) : allReports

  if (reports.length === 0) return null

  const handlePrint = (reportName: string, rLabel: string, pattern?: string) => {
    setOpen(false)
    setPrinting(reportName)
    Promise.resolve(onOpenReport(reportName, rLabel, pattern)).finally(() => setPrinting(null))
  }

  const btnCls =
    size === 'sm'
      ? 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white font-medium text-xs hover:border-neon-blue/50 transition-all disabled:opacity-50'
      : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white font-medium text-sm hover:border-neon-blue/50 shadow-glow-sm hover:shadow-glow-blue transition-all disabled:opacity-50 data-[state=open]:border-neon-blue/60'

  if (reports.length === 1) {
    const r = reports[0]
    return (
      <motion.button
        onClick={() => handlePrint(r.report_name, r.label, r.filename_pattern)}
        disabled={printing !== null}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={btnCls}
      >
        {printing ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" /> : <Printer size={size === 'sm' ? 12 : 14} />}
        {printing ? 'Gerando...' : r.label}
      </motion.button>
    )
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <motion.button
          disabled={printing !== null}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={btnCls}
        >
          {printing ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" /> : <Printer size={size === 'sm' ? 12 : 14} />}
          {printing ? 'Gerando...' : label}
          {!printing && <ChevronDown size={12} className="transition-transform data-[state=open]:rotate-180" />}
        </motion.button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[9999] min-w-[280px] rounded-xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent" />
          <div className="p-1">
            {reports.map((r) => (
              <DropdownMenu.Item
                key={r.report_name}
                onSelect={(e) => {
                  e.preventDefault()
                  handlePrint(r.report_name, r.label, r.filename_pattern)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm text-white/80 hover:text-white focus:text-white focus:bg-white/5 data-[highlighted]:bg-white/5 data-[highlighted]:text-white outline-none cursor-pointer transition-colors"
              >
                <FileText size={13} className="text-neon-blue/70 flex-shrink-0" />
                <span className="flex-1 truncate">{r.label}</span>
                <FileDown size={12} className="text-white/30" />
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
