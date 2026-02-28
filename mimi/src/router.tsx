import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { queryClient } from '#/lib/query-client'

export function getRouter() {
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
