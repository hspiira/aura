'use client'

import {
  BarChart3,
  Box,
  Clock,
  MoreHorizontal,
  Phone,
  ShoppingCart,
  TrendingUp,
  Truck,
  Video,
} from 'lucide-react'
import { cn } from '#/lib/utils'

const FLAT_CARD = 'border border-stone-200 bg-white rounded-none'

function CardHeader({
  title,
  icon,
  menu = true,
}: {
  title: string
  icon?: React.ReactNode
  menu?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      </div>
      {menu && (
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="More options"
        >
          <MoreHorizontal className="size-4" />
        </button>
      )}
    </div>
  )
}

function DeliveryByTimeCard() {
  const hours = ['6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const legend = ['0-49', '50-99', '100-149', '150-199', '200+']
  const shades = [
    'bg-violet-200',
    'bg-violet-300',
    'bg-violet-400',
    'bg-violet-500',
    'bg-violet-600',
  ]
  const mockData = hours.map(() =>
    days.map(() => Math.floor(Math.random() * 5)),
  )
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader title="Delivery by time" />
      <div className="flex flex-1 gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-end gap-1">
          <div className="flex flex-col justify-around gap-0.5 text-[10px] text-stone-500">
            {hours.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="grid grid-cols-7 gap-0.5">
              {hours.map((_, row) =>
                days.map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className={cn(
                      'aspect-square min-w-0',
                      shades[mockData[row][col]],
                    )}
                  />
                )),
              )}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-stone-500">
              {days.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 text-right text-[10px] font-medium text-stone-500">
          {legend.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeliveryTypesCard() {
  const items = [
    { label: 'Air', pct: 25, value: 750, barClass: 'bg-violet-500' },
    { label: 'Cargo', pct: 50, value: 1500, barClass: 'bg-blue-500' },
    { label: 'Sea', pct: 25, value: 750, barClass: 'bg-emerald-500' },
  ]
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader title="Delivery types" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-stone-600">Total delivery 3,000</span>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <TrendingUp className="size-3.5" />
            1.60%
          </span>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 border border-stone-200 bg-stone-50 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          <BarChart3 className="size-4" />
          Export
        </button>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-stone-700">{item.label}</span>
                <span className="text-stone-500">
                  {item.pct}% · {item.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden bg-stone-100">
                <div
                  className={cn('h-full', item.barClass)}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FinanceSummaryCard() {
  const filled = 6
  const total = 10
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader
        title="Finance Summary"
        icon={<BarChart3 className="size-4 text-stone-500" />}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-xs text-stone-500">
          Check out each column for more details
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <span className="text-stone-500">Annual companies taxes </span>
            <span className="font-medium text-stone-900">$547,483.00</span>
          </div>
          <div>
            <span className="text-stone-500">Average product price </span>
            <span className="font-medium text-stone-900">$27.47</span>
          </div>
          <div>
            <span className="text-stone-500">Next tax review date </span>
            <span className="font-medium text-stone-900">August 27, 2024</span>
          </div>
          <div>
            <span className="text-stone-500">Satisfaction rate </span>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'size-2 rounded-sm',
                    i < filled ? 'bg-violet-500' : 'bg-stone-200',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-stone-100 pt-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="size-8 overflow-hidden rounded-full border-2 border-white bg-stone-300"
                aria-hidden
              />
            ))}
          </div>
          <button
            type="button"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            See more
          </button>
        </div>
      </div>
    </div>
  )
}

function TopDeliveredCountriesCard() {
  const thisMonth = [
    { country: 'United states', pct: 60, flag: 'US' },
    { country: 'Canada', pct: 20, flag: 'CA' },
    { country: 'Other', pct: 20, flag: null },
  ]
  const prevMonth = [
    { country: 'United states', pct: 55, flag: 'US' },
    { country: 'Canada', pct: 25, flag: 'CA' },
    { country: 'Other', pct: 20, flag: null },
  ]
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader title="Top delivered countries" />
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">
              This Month
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="size-3.5" />
              2.40%
            </span>
          </div>
          <p className="text-lg font-semibold text-stone-900">3,000</p>
          <ul className="mt-2 space-y-1.5">
            {thisMonth.map((row) => (
              <li
                key={row.country}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-stone-700">
                  <span className="flex size-5 items-center justify-center rounded bg-stone-200 text-[10px] font-medium">
                    {row.flag ?? '…'}
                  </span>
                  {row.country}
                </span>
                <span className="text-stone-500">{row.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">
              Prev Month
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
              <TrendingUp className="size-3.5 rotate-180" />
              -2.20%
            </span>
          </div>
          <p className="text-lg font-semibold text-stone-900">2,209</p>
          <ul className="mt-2 space-y-1.5">
            {prevMonth.map((row) => (
              <li
                key={row.country}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-stone-700">
                  <span className="flex size-5 items-center justify-center rounded bg-stone-200 text-[10px] font-medium">
                    {row.flag ?? '…'}
                  </span>
                  {row.country}
                </span>
                <span className="text-stone-500">{row.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ServiceStatusCard() {
  const pct = 25.3
  const segments = [
    { label: 'Service needed', color: 'bg-blue-500' },
    { label: 'Pending', color: 'bg-amber-500' },
    { label: 'In Service', color: 'bg-violet-300' },
    { label: 'Fully Serviced', color: 'bg-emerald-400' },
  ]
  const size = 120
  const r = (size - 16) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const filledLength = (pct / 100) * circumference
  const gapLength = circumference - filledLength
  const strokeDasharray = `${filledLength} ${gapLength}`
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader title="Service Status" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={16}
                className="text-stone-200"
              />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={16}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className="text-emerald-400"
              />
            </svg>
            <span className="absolute text-center text-sm font-semibold text-stone-900">
              {pct}%<br />
              <span className="text-xs font-normal text-stone-500">
                Fully Serviced
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <div
                  className={cn('size-2.5 shrink-0 rounded-sm', s.color)}
                  aria-hidden
                />
                <span className="text-stone-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="w-full border border-stone-200 bg-stone-50 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Download data
        </button>
      </div>
    </div>
  )
}

function ProfileCard() {
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="size-12 overflow-hidden rounded-full bg-stone-300" />
          <div>
            <p className="font-semibold text-stone-900">Ellie Robertson</p>
            <p className="text-xs text-stone-500">Sales Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="Call"
          >
            <Phone className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="Video call"
          >
            <Video className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="More"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ActivityCard() {
  const items = [
    { label: 'Delivered', icon: Box, count: 15, barClass: 'bg-emerald-500' },
    { label: 'Ordered', icon: ShoppingCart, count: 15, barClass: 'bg-blue-500' },
    { label: 'Reported', icon: Clock, count: 15, barClass: 'bg-red-500' },
    { label: 'Arrived', icon: Truck, count: 15, barClass: 'bg-violet-500' },
  ]
  return (
    <div className={cn(FLAT_CARD, 'flex flex-col')}>
      <CardHeader
        title="Activity"
        icon={<TrendingUp className="size-4 text-stone-500" />}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-xs text-stone-500">
          Check out each collumn for more details
        </p>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center border border-stone-200 bg-stone-50">
                <item.icon className="size-4 text-stone-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900">
                  {item.label}
                </p>
                <p className="text-xs text-stone-500">
                  {item.count} new packages
                </p>
              </div>
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-stone-200">
                <div
                  className={cn('h-full w-2/3 rounded-full', item.barClass)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function DeliveryDashboardDemos() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DeliveryByTimeCard />
      <DeliveryTypesCard />
      <FinanceSummaryCard />
      <ServiceStatusCard />
      <ProfileCard />
      <ActivityCard />
      <div className="lg:col-span-2">
        <TopDeliveredCountriesCard />
      </div>
    </div>
  )
}
