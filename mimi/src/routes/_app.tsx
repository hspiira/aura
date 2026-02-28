import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from '#/lib/auth-guard'
import { AppShell } from '#/components/app-shell/AppShell'

export const Route = createFileRoute('/_app')({
  beforeLoad: requireAuth,
  component: AppLayout,
})

function AppLayout() {
  return <AppShell />
}
