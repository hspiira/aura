import { QueryClient } from '@tanstack/query-core'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
  })
  // SSR query integration disabled: it was causing "client.defaultQueryOptions is not a function"
  // during server render (duplicate query-core/react-query in Nitro bundle). Queries still run
  // on the client; server-rendered HTML will not include prefetched query data.
  return router
}
