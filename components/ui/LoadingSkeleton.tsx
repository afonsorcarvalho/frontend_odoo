'use client'

import { clsx } from 'clsx'

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-white/5 rounded-xl overflow-hidden relative',
        'after:absolute after:inset-0 after:shimmer-bg',
        className
      )}
    />
  )
}

export function LoadingSkeleton({ variant = 'card', className }: LoadingSkeletonProps) {
  if (variant === 'list') {
    return (
      <div
        className={clsx(
          'flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]',
          className
        )}
      >
        <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={clsx('space-y-6', className)}>
        <div className="flex items-center gap-6">
          <SkeletonBlock className="w-24 h-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <SkeletonBlock className="h-7 w-1/2" />
            <SkeletonBlock className="h-4 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <SkeletonBlock className="w-14 h-14 rounded-full" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
      <div className="space-y-2 pt-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-4/5" />
        <SkeletonBlock className="h-3 w-3/5" />
      </div>
    </div>
  )
}
