'use client'

import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '#/components/app-shell/AppSidebar'
import { AppTopBar } from '#/components/app-shell/AppTopBar'

export function AppShell() {
  return (
    <div className="flex h-svh bg-stone-50">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
