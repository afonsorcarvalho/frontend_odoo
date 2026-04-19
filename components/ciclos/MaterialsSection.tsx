'use client'

import { motion } from 'framer-motion'
import { Package, Factory, Hash, Calendar, Loader2, PackageX } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useCycleMaterials } from '@/lib/hooks/useCiclos'
import { CYCLE_MATERIAL_UNIT_LABEL, type OdooCycleMaterial } from '@/lib/types/ciclo'

interface MaterialsSectionProps {
  cycleId: number
  delay?: number
}

export function MaterialsSection({ cycleId, delay = 0.32 }: MaterialsSectionProps) {
  const { data: materials, isLoading, error } = useCycleMaterials(cycleId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="md:col-span-2"
    >
      <GlassCard>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-neon-blue" />
            <h3 className="text-sm font-semibold text-white">Materiais Esterilizados</h3>
          </div>
          {materials && (
            <span className="text-[10px] text-white/40 font-mono">
              {materials.length} {materials.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-white/40 text-sm">
            <Loader2 size={14} className="animate-spin text-neon-blue" />
            Carregando materiais...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-neon-pink text-sm">
            Erro ao carregar materiais
          </div>
        ) : !materials || materials.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-white/30">
            <PackageX size={24} />
            <span className="text-xs">Nenhum material cadastrado</span>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((m, i) => (
              <MaterialRow key={m.id} material={m} index={i} />
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}

function MaterialRow({ material, index }: { material: OdooCycleMaterial; index: number }) {
  const name =
    (material.material_descricao && String(material.material_descricao)) ||
    (material.material_id ? material.material_id[1] : '—')

  const fabricante =
    (material.fabricante_nome && String(material.fabricante_nome)) ||
    (material.fabricante_id ? material.fabricante_id[1] : '')

  const unidade = material.unidade ? CYCLE_MATERIAL_UNIT_LABEL[material.unidade] : ''
  const qtd = material.quantidade !== false && material.quantidade !== null ? material.quantidade : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
        <Package size={14} className="text-neon-blue" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-white/50">
          {fabricante && (
            <span className="flex items-center gap-1 truncate">
              <Factory size={10} className="text-white/30 flex-shrink-0" />
              {fabricante}
            </span>
          )}
          {material.lote && (
            <span className="flex items-center gap-1 font-mono">
              <Hash size={10} className="text-white/30" />
              {material.lote}
            </span>
          )}
          {material.validade && (
            <span className="flex items-center gap-1">
              <Calendar size={10} className="text-white/30" />
              val. {formatDate(material.validade)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-semibold text-white tabular-nums">
          {Number.isInteger(qtd) ? qtd : Number(qtd).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
        </div>
        {unidade && (
          <div className="text-[10px] text-white/40 uppercase tracking-wider">{unidade}</div>
        )}
      </div>
    </motion.div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
