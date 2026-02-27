/**
 * CRM Contact Card
 * Matches the "Sarah Johnson – Head of IT at GreenLeaf Inc." design reference.
 *
 * Subcomponents:
 *   ContactCard            – the full card shell
 *   ContactCardHeader      – avatar + name + title + action buttons row
 *   ContactCardDetail      – single label/value row (Details section)
 *   ContactCardDetails     – the expandable details block
 *   ContactCardHighlights  – right-side Highlights panel
 *   ContactCardActivity    – Activity feed list
 */

import {
  Building2,
  Calendar,
  Link2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Tag,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Card, CardHeader } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { cn } from '#/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactActivity {
  id: string
  actorName: string
  actorAvatar?: string
  actorInitials: string
  action: string
  /** e.g. "in-person meeting" */
  subject: string
  timeAgo: string
  /** icon key for the activity type */
  type: 'meeting' | 'event' | 'call' | 'email' | 'note'
}

export interface ContactHighlight {
  /** e.g. "Summary", "Upcoming", "Company", "Sales Outreach" */
  label: string
  content: React.ReactNode
}

export interface ContactCardProps {
  name: string
  title: string
  avatarUrl?: string
  initials: string
  email?: string
  phone?: string
  location?: string
  company?: string
  companyLogoUrl?: string
  lastInteracted?: string
  linkedinHandle?: string
  highlights?: ContactHighlight[]
  activities?: ContactActivity[]
  className?: string
}

// ─── Activity type → icon map ─────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<ContactActivity['type'], React.ElementType> = {
  meeting: UserCheck,
  event: Calendar,
  call: Phone,
  email: Mail,
  note: Tag,
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ContactDetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  href?: string
}) {
  return (
    <div className="grid grid-cols-[24px_80px_1fr] items-start gap-2 py-1.5 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-stone-400" />
      <span className="truncate text-stone-500">{label}</span>
      {href ? (
        <a
          href={href}
          className="truncate font-medium text-sky-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="truncate font-medium text-stone-800">{value}</span>
      )}
    </div>
  )
}

function ActivityItem({ activity }: { activity: ContactActivity }) {
  const Icon = ACTIVITY_ICONS[activity.type]
  return (
    <div className="flex items-start gap-3 py-2.5">
      {/* Activity type icon */}
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400">
        <Icon className="size-3.5" />
      </span>
      {/* Actor avatar */}
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarImage src={activity.actorAvatar} alt={activity.actorName} />
        <AvatarFallback>{activity.actorInitials}</AvatarFallback>
      </Avatar>
      {/* Description */}
      <p className="flex-1 text-sm leading-snug text-stone-700">
        <span className="font-medium text-stone-900">{activity.actorName}</span>{' '}
        {activity.action}{' '}
        <span className="font-medium text-stone-900 underline decoration-dotted underline-offset-2">
          {activity.subject}
        </span>
      </p>
      {/* Time */}
      <span className="shrink-0 text-xs text-stone-400">{activity.timeAgo}</span>
    </div>
  )
}

// ─── HighlightTile ────────────────────────────────────────────────────────────

function HighlightTile({
  label,
  content,
  className,
}: {
  label: string
  content: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-stone-200 bg-stone-50 p-4',
        className,
      )}
    >
      <p className="mb-2 text-xs font-medium text-stone-500">{label}</p>
      <div className="text-sm text-stone-800">{content}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CrmContactCard({
  name,
  title,
  avatarUrl,
  initials,
  email,
  phone,
  location,
  company,
  companyLogoUrl,
  lastInteracted,
  linkedinHandle,
  highlights = [],
  activities = [],
  className,
}: ContactCardProps) {
  return (
    <Card
      className={cn(
        'w-full overflow-hidden rounded-2xl border-stone-200 bg-white shadow-md',
        className,
      )}
    >
      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* ── LEFT: identity + details ──────────────────────────────────── */}
        <div className="flex flex-col border-b border-stone-100 p-5 md:border-b-0 md:border-r">
          {/* Avatar + name */}
          <div className="mb-4 flex items-start gap-3">
            <Avatar size="lg" className="size-12 shrink-0">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-stone-900">
                {name}
              </p>
              <p className="truncate text-sm text-stone-500">{title}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Mail className="size-3.5" />
              Compose email
            </Button>
            <Button variant="ghost" size="icon-sm">
              <UserPlus className="size-4 text-stone-500" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <RefreshCcw className="size-4 text-stone-500" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Link2 className="size-4 text-stone-500" />
            </Button>
          </div>

          <Separator className="mb-4" />

          {/* Details section */}
          <div>
            <button
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-700"
              type="button"
            >
              <span>↓</span> Details
            </button>

            <div className="flex flex-col">
              <ContactDetailRow
                icon={Tag}
                label="Name"
                value={name}
              />
              <ContactDetailRow
                icon={Tag}
                label="Description"
                value={title}
              />
              {email && (
                <ContactDetailRow
                  icon={Mail}
                  label="Email"
                  value={email}
                  href={`mailto:${email}`}
                />
              )}
              {location && (
                <ContactDetailRow
                  icon={MapPin}
                  label="Location"
                  value={location}
                />
              )}
              {company && (
                <ContactDetailRow
                  icon={Building2}
                  label="Company"
                  value={
                    <span className="flex items-center gap-1.5">
                      {companyLogoUrl ? (
                        <img
                          src={companyLogoUrl}
                          alt={company}
                          className="size-4 rounded"
                        />
                      ) : (
                        <Building2 className="size-3.5 text-stone-400" />
                      )}
                      {company}
                    </span>
                  }
                />
              )}
              {phone && (
                <ContactDetailRow
                  icon={Phone}
                  label="Phone"
                  value={phone}
                  href={`tel:${phone}`}
                />
              )}
              {linkedinHandle && (
                <ContactDetailRow
                  icon={Link2}
                  label="LinkedIn"
                  value={linkedinHandle}
                  href={`https://linkedin.com/in/${linkedinHandle}`}
                />
              )}
              {lastInteracted && (
                <ContactDetailRow
                  icon={Calendar}
                  label="Last interac…"
                  value={lastInteracted}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: highlights + activity ──────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5">
          {/* Highlights header */}
          <CardHeader className="gap-1 p-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <span className="inline-grid size-5 place-items-center rounded bg-stone-100 text-stone-500">
                ▦
              </span>
              Highlights
            </p>
          </CardHeader>

          {/* Highlight tiles grid */}
          {highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {highlights.map((h) => (
                <HighlightTile
                  key={h.label}
                  label={h.label}
                  content={h.content}
                />
              ))}
            </div>
          )}

          <Separator />

          {/* Activity feed */}
          <div>
            <button
              className="mb-1 flex items-center gap-2 text-sm font-semibold text-stone-800"
              type="button"
            >
              <span>⚡</span> Activity
              <span className="text-stone-400">›</span>
            </button>

            {activities.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">
                No activity yet.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {activities.map((a) => (
                  <ActivityItem key={a.id} activity={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Demo wrapper (used on Components page) ───────────────────────────────────

const DEMO_HIGHLIGHTS: ContactHighlight[] = [
  {
    label: 'Summary',
    content: (
      <p className="line-clamp-3 text-xs text-stone-600">
        Sarah Johnson, the Head of IT, is leading the initiative to modernize
        their data infrastructure,…
      </p>
    ),
  },
  {
    label: 'Upcoming',
    content: (
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-stone-800">Demo Call</p>
          <p className="text-xs text-stone-500">Nov 29, 10:40 AM</p>
        </div>
        <span className="flex size-8 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <span className="text-[9px] font-bold uppercase">THU</span>
          <span className="text-sm font-bold leading-none">29</span>
        </span>
      </div>
    ),
  },
  {
    label: 'Company',
    content: (
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
          GL
        </span>
        <div>
          <p className="text-xs font-semibold text-stone-800">GreenLeaf Inc.</p>
          <p className="text-xs text-stone-500">San Francisco, CA</p>
        </div>
      </div>
    ),
  },
  {
    label: 'LinkedIn',
    content: (
      <div className="flex items-center justify-between">
        <a
          href="#"
          className="text-xs font-medium text-sky-600 hover:underline"
        >
          sarahjohnson
        </a>
        <span className="flex size-5 items-center justify-center rounded bg-sky-700 text-white">
          <span className="text-[9px] font-black">in</span>
        </span>
      </div>
    ),
  },
  {
    label: 'Sales Outreach',
    content: (
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-stone-700">
            Step 2{' '}
            <span className="font-normal text-stone-500">Automated email</span>
          </span>
          <span className="text-stone-400">›</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div className="h-full w-2/5 rounded-full bg-emerald-500" />
        </div>
      </div>
    ),
  },
]

const DEMO_ACTIVITIES: ContactActivity[] = [
  {
    id: '1',
    actorName: 'Michael Chang',
    actorInitials: 'MC',
    action: 'attended an',
    subject: 'in-person meeting',
    timeAgo: '6 hours ago',
    type: 'meeting',
  },
  {
    id: '2',
    actorName: 'Sarah Johnson',
    actorInitials: 'SJ',
    action: 'attended an',
    subject: 'event',
    timeAgo: '2 days ago',
    type: 'event',
  },
  {
    id: '3',
    actorName: 'Michael Chang',
    actorInitials: 'MC',
    action: 'made an',
    subject: 'outbound phone call',
    timeAgo: '4 days ago',
    type: 'call',
  },
]

export function CrmContactCardDemo() {
  return (
    <div className="rounded-2xl bg-stone-100/80 p-6 md:p-10">
      <p className="mb-6 text-center">
        <span className="rounded-full bg-stone-300/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-600">
          CRM – Contact Card
        </span>
      </p>
      <CrmContactCard
        name="Sarah Johnson"
        title="Head of IT at GreenLeaf Inc."
        initials="SJ"
        email="sarah@greenleaf.com"
        location="San Francisco, CA"
        company="GreenLeaf Inc."
        lastInteracted="6 hours ago"
        linkedinHandle="sarahjohnson"
        highlights={DEMO_HIGHLIGHTS}
        activities={DEMO_ACTIVITIES}
        className="mx-auto max-w-3xl"
      />
    </div>
  )
}
