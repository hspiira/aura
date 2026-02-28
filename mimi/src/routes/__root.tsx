import '#/styles.css'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AppErrorPage, NotFoundPage } from '#/components/error-pages'
import { wireApiAuth } from '#/lib/api-auth-wire'
import { queryClient } from '#/lib/query-client'
import { authStore, setAuth } from '#/stores/auth'

/** Renders children only after client mount. Avoids running useQuery during SSR (Nitro bundle has duplicate query-core, causing "defaultQueryOptions is not a function"). */
function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return fallback
  return children
}

// Wire token getter and 401 handler at module load time — runs before any render,
// including SSR. The functions are no-ops when window is undefined.
wireApiAuth()

export const Route = createRootRouteWithContext<{
  queryClient?: import('@tanstack/react-query').QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Aura' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error }) => <AppErrorPage error={error} />,
})

function RootComponent() {
  // Rehydrate auth from localStorage after client mount (SSR may have left store empty)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('aura_auth')
      if (!raw) return
      const data = JSON.parse(raw) as { token?: string; userId?: string }
      const token = typeof data.token === 'string' ? data.token : null
      if (token && authStore.state.token !== token) {
        setAuth(token, data.userId ?? null)
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RootDocument>
        <ClientOnly
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500">
              Loading…
            </div>
          }
        >
          <Outlet />
        </ClientOnly>
      </RootDocument>
    </QueryClientProvider>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
