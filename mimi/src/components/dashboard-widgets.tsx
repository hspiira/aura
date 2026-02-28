'use client'

import {
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Gamepad2,
  Heart,
  Lightbulb,
  MoreHorizontal,
  PieChart,
  Train,
  Wallet,
  Wifi,
} from 'lucide-react'
import { cn } from '#/lib/utils'

const cardBase = 'border border-stone-200 bg-white'

function QuickMenuSubscriptions() {
  const items = [
    {
      icon: Wifi,
      title: 'Internet',
      amount: '$84.00/month',
      status: 'Due Date' as const,
    },
    {
      icon: Train,
      title: 'Train Loan',
      amount: '$250.00/month',
      status: 'Not Paid' as const,
    },
    {
      icon: Gamepad2,
      title: 'Monster Hunter',
      amount: '$1,560.00/month',
      status: 'Paid' as const,
    },
  ]
  const statusStyles = {
    'Due Date': 'bg-rose-500 text-white',
    'Not Paid': 'bg-amber-200 text-amber-900',
    Paid: 'bg-emerald-200 text-emerald-800',
  }
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Quick Menu
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center border border-stone-200 bg-stone-50">
              <item.icon className="size-4 text-stone-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-stone-900">{item.title}</div>
              <div className="text-xs text-stone-500">{item.amount}</div>
            </div>
            <span
              className={cn(
                'shrink-0 px-2 py-1 text-xs font-medium',
                statusStyles[item.status],
              )}
            >
              {item.status}
            </span>
            <button
              type="button"
              className="shrink-0 p-1 text-stone-400 hover:text-stone-600"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function YourBalanceCard() {
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-900">
            Your Balance
          </span>
        </div>
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="Expand"
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>
      <div className="text-2xl font-bold text-stone-900">$18,560.20</div>
      <div className="mt-1 text-sm font-medium text-emerald-600">+8%</div>
      <p className="mt-2 text-sm text-stone-600">
        Receive <span className="font-medium text-emerald-600">$6,282.00</span>{' '}
        in this month.
      </p>
    </div>
  )
}

function QuickMenuLinks() {
  const links = [
    { icon: CreditCard, label: 'My Cards' },
    { icon: PieChart, label: 'Spending Summary' },
    { icon: ArrowLeftRight, label: 'Exchange Currency' },
  ]
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Quick Menu
      </h2>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <button
            key={link.label}
            type="button"
            className="flex items-center gap-3 border border-stone-200 bg-stone-50 py-2.5 pl-3 pr-4 text-left text-sm font-medium text-stone-800 transition hover:bg-stone-100"
          >
            <link.icon className="size-4 text-stone-500" />
            {link.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FinanceHealthCard() {
  const filled = 7
  const total = 10
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-900">
            Finance Health
          </span>
        </div>
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="Expand"
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>
      <div className="font-semibold text-stone-900">
        Your Finance is Excellent
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Have succeeded in reducing outgoing costs.
      </p>
      <div className="mt-3 font-medium text-emerald-600">Saved $2,050.00</div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 border border-stone-200',
              i < filled ? 'bg-emerald-500' : 'bg-stone-100',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function ElectricityBillCard() {
  return (
    <div className="border border-blue-600 bg-blue-600 p-4 text-white">
      <div className="flex items-start justify-between">
        <Lightbulb className="size-6 shrink-0 text-blue-200" />
        <span className="text-xl font-bold">$1,250.40</span>
      </div>
      <div className="mt-3 font-semibold">Electricity Bill Due</div>
      <p className="mt-1 text-sm text-blue-200">
        Due today, September 20, 2024
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="border border-emerald-400 bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Pay Now
        </button>
      </div>
    </div>
  )
}

function RecentTransactions() {
  const transactions = [
    { name: 'Light Co.', amount: '$36.00', status: 'Pending' as const },
    { name: 'Vera K.', amount: '$85.00', status: 'Money In' as const },
    { name: 'Netflix', amount: '-$57.00', status: 'Money Out' as const },
    { name: 'Car Rental', amount: '-$72.00', status: 'Pending' as const },
  ]
  const statusStyles = {
    Pending: 'bg-stone-200 text-stone-700',
    'Money In': 'bg-emerald-200 text-emerald-800',
    'Money Out': 'bg-red-200 text-red-800',
  }
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Recent Transactions
      </h2>
      <ul className="flex flex-col gap-3">
        {transactions.map((tx) => (
          <li
            key={tx.name}
            className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 last:border-0 last:pb-0"
          >
            <span className="font-medium text-stone-900">{tx.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  tx.amount.startsWith('-')
                    ? 'text-red-600'
                    : 'text-stone-900',
                )}
              >
                {tx.amount}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium',
                  statusStyles[tx.status],
                )}
              >
                {tx.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MasterCardItem({
  amount,
  status,
  statusColor,
  cardGradient,
}: {
  amount: string
  status: string
  statusColor: string
  cardGradient: string
}) {
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-bold text-stone-900">{amount}</div>
          <div className="text-sm text-stone-500">Master Card</div>
          <div className={cn('mt-1 text-xs font-medium', statusColor)}>
            {status}
          </div>
        </div>
        <div className="flex h-14 w-24 flex-col justify-between overflow-hidden border border-stone-300 bg-white p-2">
          <div className="text-[10px] font-medium text-stone-600">My Card</div>
          <div className="text-xs font-mono text-stone-700">0234</div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-500">06/26</span>
            <div className={cn('h-2 w-8', cardGradient)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function YourExpensesCard() {
  return (
    <div className={cn(cardBase, 'flex flex-col p-4')}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-900">
            Your Expenses
          </span>
        </div>
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="Expand"
        >
          <ArrowUpRight className="size-4" />
        </button>
      </div>
      <div className="text-2xl font-bold text-stone-900">$4,240.60</div>
      <div className="mt-1 text-sm font-medium text-red-600">-4%</div>
      <p className="mt-2 text-sm text-stone-600">
        Last month you expenses{' '}
        <span className="font-medium text-red-600">$4,070.90</span>.
      </p>
    </div>
  )
}

export function DashboardWidgetsDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 bg-stone-100 p-4 md:grid-cols-3 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <QuickMenuSubscriptions />
        <YourBalanceCard />
        <QuickMenuLinks />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-4">
        <FinanceHealthCard />
        <ElectricityBillCard />
        <RecentTransactions />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-4">
        <MasterCardItem
          amount="$8,960.00"
          status="Active"
          statusColor="text-emerald-600"
          cardGradient="bg-gradient-to-br from-indigo-400 to-purple-500"
        />
        <MasterCardItem
          amount="$4,250.00"
          status="Active"
          statusColor="text-emerald-600"
          cardGradient="bg-gradient-to-br from-teal-400 to-cyan-500"
        />
        <MasterCardItem
          amount="$2,490.00"
          status="Disabled"
          statusColor="text-amber-600"
          cardGradient="bg-gradient-to-br from-amber-400 to-orange-600"
        />
        <YourExpensesCard />
      </div>
    </div>
  )
}
