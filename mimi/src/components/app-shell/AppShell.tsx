'use client'

import { Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AppSidebar } from '#/components/app-shell/AppSidebar'
import { AppTopBar } from '#/components/app-shell/AppTopBar'

export function AppShell() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-svh bg-stone-50">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar />
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
}
