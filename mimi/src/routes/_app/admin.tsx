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
    <div className="flex flex-col gap-4">
      <div className="-mx-4 -mt-4 border-b border-stone-200 bg-white">
        <nav className="flex h-12 items-stretch gap-1 px-4">
          {ADMIN_LINKS.map(({ to, label }) => {
            const isActive = pathname === to || pathname.startsWith(to + '/')
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'inline-flex h-full items-center border-b-2 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
