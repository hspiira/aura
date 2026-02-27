import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/admin')({
  component: AdminLayout,
})

const ADMIN_LINKS = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/roles', label: 'Roles' },
  { to: '/admin/tokens', label: 'Tokens' },
  { to: '/admin/cycles', label: 'Cycles' },
  { to: '/admin/templates', label: 'Templates' },
  { to: '/admin/dimensions', label: 'Dimensions' },
  { to: '/admin/reward-policies', label: 'Reward policies' },
  { to: '/admin/notifications', label: 'Notifications' },
] as const

function AdminLayout() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <div className="flex gap-6">
      <nav className="w-48 shrink-0 space-y-0.5 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Admin
        </p>
        {ADMIN_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-medium transition',
              pathname === to || pathname.startsWith(to + '/')
                ? 'bg-amber-100 text-amber-900'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
