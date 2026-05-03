'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface UseCardNavigationOptions {
  loadingId: number | null
  setLoadingId: (id: number | null) => void
  /** Delay antes de mostrar overlay — evita piscada em navegações rápidas. */
  delayMs?: number
}

interface UseCardNavigationResult {
  navigate: (id: number, href: string) => void
  isLoadingId: (id: number) => boolean
}

/**
 * Hook genérico para navegação com overlay de loading em cards de lista.
 *
 * Comportamento:
 * - Clique em um card dispara router.push imediatamente; o overlay só
 *   aparece se a rota demorar mais do que `delayMs` (padrão 150ms).
 * - Trocar de card enquanto o anterior ainda está carregando troca o
 *   overlay instantaneamente — nunca dois ativos ao mesmo tempo.
 * - Ao mudar o pathname (detalhe montou), limpa o estado automaticamente.
 *
 * O estado é externo (`loadingId`/`setLoadingId`) para que cada módulo
 * guarde o seu — ciclos no ciclosStore, OS no osStore, etc.
 */
export function useCardNavigation({
  loadingId,
  setLoadingId,
  delayMs = 150,
}: UseCardNavigationOptions): UseCardNavigationResult {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (loadingId !== null) setLoadingId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const navigate = (id: number, href: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (loadingId !== null) {
      // Overlay já visível em outro card — troca instantâneo (feedback imediato)
      setLoadingId(id)
    } else {
      timerRef.current = setTimeout(() => {
        setLoadingId(id)
        timerRef.current = null
      }, delayMs)
    }
    router.push(href)
  }

  return {
    navigate,
    isLoadingId: (id: number) => loadingId === id,
  }
}
