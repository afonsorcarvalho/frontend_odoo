'use client'

import { Play, CheckCircle2, Ban, Pause, RotateCcw, ShieldX, PackageSearch, FileCheck2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useTransitionOs } from '@/lib/hooks/useOs'
import { OS_STATE_LABEL, type OsState } from '@/lib/types/os'
import type { ReactNode } from 'react'

interface Transition {
  label: string
  icon: ReactNode
  action?: string
  targetState?: OsState
  variant?: 'default' | 'success' | 'danger' | 'warning'
}

const TRANSITIONS: Partial<Record<OsState, Transition[]>> = {
  draft: [
    { label: 'Iniciar orçamento', icon: <FileCheck2 size={14} />, action: 'action_start_execution', variant: 'default' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  under_budget: [
    { label: 'Pausar orçamento', icon: <Pause size={14} />, targetState: 'pause_budget', variant: 'warning' },
    { label: 'Aguardar aprovação', icon: <PackageSearch size={14} />, targetState: 'wait_authorization', variant: 'warning' },
    { label: 'Reprovar', icon: <ShieldX size={14} />, targetState: 'reproved', variant: 'danger' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  pause_budget: [
    { label: 'Retomar orçamento', icon: <RotateCcw size={14} />, targetState: 'under_budget', variant: 'default' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  wait_authorization: [
    { label: 'Pronta para Execução', icon: <Play size={14} />, targetState: 'execution_ready', variant: 'default' },
    { label: 'Esperar peças', icon: <PackageSearch size={14} />, targetState: 'wait_parts', variant: 'warning' },
    { label: 'Reprovar', icon: <ShieldX size={14} />, targetState: 'reproved', variant: 'danger' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  wait_parts: [
    { label: 'Pronta para Execução', icon: <Play size={14} />, targetState: 'execution_ready', variant: 'default' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  execution_ready: [
    { label: 'Iniciar execução', icon: <Play size={14} />, targetState: 'under_repair', variant: 'default' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  under_repair: [
    { label: 'Finalizar', icon: <CheckCircle2 size={14} />, action: 'action_repair_end', variant: 'success' },
    { label: 'Pausar execução', icon: <Pause size={14} />, targetState: 'pause_repair', variant: 'warning' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  pause_repair: [
    { label: 'Retomar execução', icon: <RotateCcw size={14} />, targetState: 'under_repair', variant: 'default' },
    { label: 'Cancelar', icon: <Ban size={14} />, targetState: 'cancel', variant: 'danger' },
  ],
  reproved: [
    { label: 'Retornar à draft', icon: <RotateCcw size={14} />, targetState: 'draft', variant: 'default' },
  ],
  done: [],
  cancel: [
    { label: 'Reabrir em draft', icon: <RotateCcw size={14} />, targetState: 'draft', variant: 'default' },
  ],
}

export function OsTransitionBar({
  id,
  state,
  onIniciarExecucao,
  busy,
}: {
  id: number
  state: OsState | false
  /** Se fornecido, substitui o click da transição "Iniciar execução" (execution_ready → under_repair) */
  onIniciarExecucao?: () => void
  /** Trava todos os botões enquanto uma ação externa está em andamento */
  busy?: boolean
}) {
  const transition = useTransitionOs()
  if (!state) return null

  const actions = TRANSITIONS[state] ?? []
  const disabled = transition.isPending || !!busy

  const handleClick = (a: Transition) => {
    // Intercepta "Iniciar execução"
    if (onIniciarExecucao && state === 'execution_ready' && a.targetState === 'under_repair') {
      onIniciarExecucao()
      return
    }
    transition.mutate({ id, action: a.action, targetState: a.targetState })
  }

  if (actions.length === 0) {
    return (
      <div className="text-xs text-white/40">
        Estado atual: {OS_STATE_LABEL[state]} — sem transições disponíveis.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => handleClick(a)}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
            disabled && 'opacity-50 cursor-wait',
            a.variant === 'success' && 'bg-neon-green/10 border-neon-green/40 text-neon-green hover:bg-neon-green/20',
            a.variant === 'danger'  && 'bg-neon-pink/10 border-neon-pink/40 text-neon-pink hover:bg-neon-pink/20',
            a.variant === 'warning' && 'bg-neon-orange/10 border-neon-orange/40 text-neon-orange hover:bg-neon-orange/20',
            (!a.variant || a.variant === 'default') && 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue hover:bg-neon-blue/20'
          )}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  )
}
