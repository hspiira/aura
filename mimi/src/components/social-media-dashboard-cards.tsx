'use client'

import {
  BarChart3,
  Flag,
  MoreHorizontal,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '#/lib/utils'

const CARD =
  'border border-stone-200 bg-white overflow-hidden'

function AccountOverviewCard() {
  const [activeTab, setActiveTab] = useState<'locations' | 'age' | 'gender'>(
    'locations',
  )
  const locations = [
    { name: 'United States', value: 197520, max: 197520 },
    { name: 'Brazil', value: 32985, max: 197520 },
    { name: 'Switzerland', value: 10254, max: 197520 },
  ]
  const chartPoints = useMemo(() => {
    const y = [0.3, 0.6, 0.9, 0.7, 0.5, 0.8, 0.4]
    const w = 200
    const h = 80
    const pad = { left: 8, right: 8, top: 8, bottom: 20 }
    const plotW = w - pad.left - pad.right
    const plotH = h - pad.top - pad.bottom
    return y.map((v, i) => ({
      x: pad.left + (i / (y.length - 1)) * plotW,
      y: pad.top + (1 - v) * plotH,
    }))
  }, [])
  const lineD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex items-center justify-between border-b border-stone-100 p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 overflow-hidden rounded-full bg-stone-300" />
          <div>
            <p className="font-semibold text-stone-900">@samanthawilliam_</p>
            <p className="text-xs text-stone-500">Instagram</p>
          </div>
        </div>
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="Menu"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      <div className="border-b border-stone-100 p-4">
        <p className="text-2xl font-bold text-stone-900">278,534</p>
        <p className="text-sm text-stone-500">Followers</p>
      </div>
      <div className="border-b border-stone-100 p-2">
        <div className="flex gap-1">
          {[
            { id: 'locations' as const, label: 'Top Locations' },
            { id: 'age' as const, label: 'Age Range' },
            { id: 'gender' as const, label: 'Gender' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition',
                activeTab === tab.id
                  ? 'bg-violet-100 text-violet-800'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'locations' && (
        <div className="space-y-3 p-4">
          {locations.map((loc) => (
            <div key={loc.name}>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-stone-700">{loc.name}</span>
                <span className="text-stone-500">
                  {loc.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${(loc.value / loc.max) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-stone-100 p-4">
        <p className="text-sm font-semibold text-stone-900">
          Profile Views Period
        </p>
        <p className="text-xs text-stone-500">
          The time when your followers visit your profile page.
        </p>
        <div className="relative mt-3">
          <svg width={216} height={108} className="overflow-visible">
            <path
              d={lineD}
              fill="none"
              stroke="rgb(99 102 241)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute left-1/2 top-2 -translate-x-1/2 border border-stone-200 bg-white px-2 py-1">
            <span className="text-xs font-semibold text-stone-900">
              125.2K views
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-stone-400">
            <span>1 PM</span>
            <span>7 PM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function YourAccountsCard() {
  const accounts = [
    {
      handle: '@samanthawilliam_',
      platform: 'Instagram',
      followers: '278,534',
      active: true,
    },
    {
      handle: '@samanthawilliam_',
      platform: 'Twitter / X',
      followers: '48,150',
      active: false,
    },
  ]
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Your Accounts</h3>
          <p className="text-xs text-stone-500">You have 2 accounts</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Plus className="size-4" />
          Add Account
        </button>
      </div>
      <div className="divide-y divide-stone-100 p-2">
        {accounts.map((acc) => (
          <div
            key={acc.platform}
            className="flex items-center justify-between gap-3 p-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-stone-300" />
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">
                  {acc.handle}
                </p>
                <p className="text-xs text-stone-500">
                  {acc.platform} · {acc.followers} Followers
                </p>
              </div>
            </div>
            {acc.active ? (
              <span className="shrink-0 bg-pink-500 px-2.5 py-1 text-xs font-medium text-white">
                Active
              </span>
            ) : (
              <button
                type="button"
                className="shrink-0 p-1 text-stone-400 hover:text-stone-600"
                aria-label="Menu"
              >
                <MoreHorizontal className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PostActivityCard() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const highlighted = [5, 12, 18, 24, 35]
  const allDays = Array.from({ length: 35 }, (_, i) => i + 1)
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Post Activity</h3>
          <p className="text-xs text-stone-500">From 15 Feb - 15 May, 2024</p>
        </div>
        <button
          type="button"
          className="border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Change Period
        </button>
      </div>
      <div className="border-b border-stone-100 p-4">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-stone-900">687</p>
            <p className="text-xs text-stone-500">Stories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-900">189</p>
            <p className="text-xs text-stone-500">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-900">24</p>
            <p className="text-xs text-stone-500">Reels</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-stone-500">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {allDays.map((d) => (
            <div
              key={d}
              className={cn(
                'flex aspect-square items-center justify-center rounded-full text-xs font-medium',
                highlighted.includes(d)
                  ? 'bg-violet-500 text-white'
                  : 'bg-stone-100 text-stone-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnomalyDetectedCard() {
  const bars = [0.4, 0.6, 0.5, 0.9, 0.7, 0.8]
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex items-start justify-between gap-2 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Anomaly Detected</h3>
          <p className="mt-0.5 text-sm text-stone-600">
            Your followers are increasing beyond our predictions. It could be
            because someone shared one of your posts.
          </p>
        </div>
        <div className="shrink-0 bg-amber-100 p-1.5">
          <Flag className="size-4 text-amber-600" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex h-20 items-end justify-between gap-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 min-w-0 bg-emerald-300"
              style={{ height: `${Math.round(h * 72)}px` }}
            />
          ))}
        </div>
        <p className="text-center text-sm font-medium text-emerald-700">
          +1,092 Followers
        </p>
        <div className="text-center">
          <p className="text-3xl font-bold text-stone-900">98.2%</p>
          <p className="text-xs text-stone-500">Prediction 45%</p>
        </div>
        <button
          type="button"
          className="w-full border border-blue-200 bg-white py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          See Details
        </button>
      </div>
    </div>
  )
}

function PostScheduleCard() {
  const schedule = [
    {
      time: '09:15',
      text: 'Sometimes we forgot about the most important things in...',
      color: 'bg-violet-100',
    },
    {
      time: '12:30',
      text: 'Quick reminder to having proper lunch and you can back to...',
      color: 'bg-pink-100',
    },
  ]
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Post Schedule</h3>
          <p className="text-xs text-stone-500">25 posts scheduled</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
        >
          <Plus className="size-4" />
          Add Post
        </button>
      </div>
      <div className="space-y-4 p-4">
        {schedule.map((item) => (
          <div key={item.time} className="flex gap-3">
            <span className="w-12 shrink-0 pt-1 text-xs font-medium text-stone-500">
              {item.time}
            </span>
            <div
              className={cn(
                'flex flex-1 gap-2 border border-stone-100 p-3',
                item.color,
              )}
            >
              <p className="line-clamp-2 flex-1 text-sm text-stone-700">
                {item.text}
              </p>
              <div className="size-12 shrink-0 overflow-hidden bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PostInsightsCard() {
  return (
    <div className={cn(CARD, 'flex flex-col')}>
      <div className="flex items-start justify-between gap-2 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Post Insights</h3>
          <p className="text-xs text-stone-500">
            Posted on May 10, 2024 - 6:10pm
          </p>
        </div>
        <div className="size-14 shrink-0 overflow-hidden bg-stone-200" />
      </div>
      <div className="border-b border-stone-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-blue-500" />
            <span className="text-sm text-stone-600">Accounts Reached</span>
          </div>
          <span className="font-semibold text-stone-900">5,192,879</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-violet-500" />
            <span className="text-sm text-stone-600">Followers</span>
          </div>
          <span className="font-semibold text-emerald-600">+2,953</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-stone-900">Unique Finding</p>
        <p className="mt-1 text-sm text-stone-600">
          You have gained more reach and followers when the post is related to
          workspace or productivity. Keep it up!
        </p>
        <div className="my-4 flex h-24 items-center justify-center bg-stone-100">
          <span className="text-xs text-stone-400">Illustration placeholder</span>
        </div>
        <button
          type="button"
          className="w-full border border-blue-200 bg-white py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Subscribe for another finding
        </button>
      </div>
    </div>
  )
}

export function SocialMediaDashboardDemo() {
  return (
    <div className="bg-stone-100/80 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AccountOverviewCard />
        <PostActivityCard />
        <PostScheduleCard />
        <YourAccountsCard />
        <AnomalyDetectedCard />
        <PostInsightsCard />
      </div>
    </div>
  )
}
