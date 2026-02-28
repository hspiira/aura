'use client'

import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { filterNavByPermission, NAV_ITEMS } from '#/components/app-shell/nav-config'
import { cn } from '#/lib/utils'
import { meQueryOptions } from '#/lib/queries'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { useIsMobile } from '#/hooks/use-mobile'

const SIDEBAR_WIDTH_EXPANDED = '16rem'
const SIDEBAR_WIDTH_COLLAPSED = '4rem'

export function AppSidebar() {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { data: me } = useQuery(meQueryOptions())
  const permissions = me?.permissions ?? []
  const items = filterNavByPermission(NAV_ITEMS, permissions)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-stone-200/80 bg-white">
      <div className="flex h-12 shrink-0 items-center border-b border-stone-200/80 px-3">
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-sm p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-auto p-2" aria-label="Main">
        {items.map((item) => {
          const href = typeof item.to === 'string' ? item.to : (item.to as { to: string }).to
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          const Icon = item.icon
          return (
            <Link
              key={href}
              to={href}
              onClick={() => isMobile && setOpenMobile(false)}
              className={cn(
                'flex items-center gap-3 rounded-sm px-2.5 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-sm p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 max-w-[18rem] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col border-r border-stone-200/80 bg-white">
              <nav className="flex-1 space-y-0.5 overflow-auto p-2 pt-4" aria-label="Main">
                {items.map((item) => {
                  const href = typeof item.to === 'string' ? item.to : (item.to as { to: string }).to
                  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-sm px-2.5 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-amber-50 text-amber-800'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside
      className="hidden shrink-0 flex-col border-r border-stone-200/80 bg-white transition-[width] duration-200 md:flex"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
    >
      {sidebarContent}
    </aside>
  )
}
