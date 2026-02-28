import '#/styles.css'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { AppErrorPage, NotFoundPage } from '#/components/error-pages'
import { wireApiAuth } from '#/lib/api-auth-wire'
import { authStore, setAuth } from '#/stores/auth'

// Wire token getter and 401 handler at module load time — runs before any render,
// including SSR. The functions are no-ops when window is undefined.
wireApiAuth()

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
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
  const router = useRouter()
  const queryClient = (router.options as { context?: { queryClient: QueryClient } })
    .context?.queryClient
  if (!queryClient) {
    throw new Error('Root route context must include queryClient')
  }

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
        <Outlet />
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
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
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
