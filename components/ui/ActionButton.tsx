'use client'

import { useState, ReactNode, MouseEvent } from 'react'
import { AnimatedButton } from './AnimatedButton'

type Variant = 'neon' | 'ghost' | 'danger' | 'secondary'

interface ActionButtonProps {
  /** Handler — pode ser síncrono ou assíncrono. Loading state gerenciado automaticamente se retornar Promise. */
  onAction?: (e?: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
  /** Sobrepõe loading interno com controle externo (ex: mutation.isPending) */
  pending?: boolean
  icon?: ReactNode
  /** Ícone exibido quando em loading (default: spinner do AnimatedButton) */
  loadingIcon?: ReactNode
  /** Texto durante loading (default: children original) */
  loadingText?: ReactNode
  variant?: Variant
  glow?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  title?: string
  children: ReactNode
}

/**
 * Botão de ação com spinner automático durante execução de handler async.
 * Reutilizável em todas as ações: transições de estado, CRUD, etc.
 */
export function ActionButton({
  onAction,
  pending,
  icon,
  loadingText,
  variant = 'ghost',
  glow,
  disabled,
  type = 'button',
  className,
  title,
  children,
}: ActionButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = pending ?? internalLoading

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    if (!onAction || loading || disabled) return
    try {
      const result = onAction(e)
      if (result instanceof Promise) {
        setInternalLoading(true)
        await result
      }
    } catch {
      // Erros devem ser tratados pelo caller (toast, etc.) — aqui só limpamos loading
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <AnimatedButton
      type={type}
      variant={variant}
      glow={glow}
      icon={icon}
      loading={loading}
      disabled={disabled}
      onClick={handleClick}
      className={className}
      title={title}
    >
      {loading && loadingText ? loadingText : children}
    </AnimatedButton>
  )
}
