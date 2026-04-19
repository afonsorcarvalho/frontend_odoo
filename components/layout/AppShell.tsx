'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from './AppSidebar'

const PUBLIC_ROUTES = ['/login']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <div className="md:pl-60">
        {children}
      </div>
    </div>
  )
}
