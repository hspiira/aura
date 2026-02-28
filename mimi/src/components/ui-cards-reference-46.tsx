'use client'

import {
  ChevronDown,
  ChevronRight,
  Heart,
  Info,
  LayoutGrid,
  Link2,
  Lock,
  MessageCircle,
  Palette,
  Share2,
  Users,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Progress } from '#/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'

const cardBase = 'border border-stone-200 bg-white'

// Four-petal / propeller-style icon (simplified)
function BaseComponentsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-8 text-stone-600"
    >
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeLinecap="square" />
      <path
        d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83"
        strokeLinecap="square"
      />
    </svg>
  )
}

function TopRowCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className={cn(cardBase, 'flex flex-col gap-3 p-4')}>
        <BaseComponentsIcon />
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-stone-900">Base Components</h3>
          <span className="border border-stone-300 bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
            FREE
          </span>
        </div>
        <p className="text-sm text-stone-600">
          40+ base components available as open-source.
        </p>
      </div>
      <div className={cn(cardBase, 'flex flex-col gap-3 p-4')}>
        <LayoutGrid className="size-8 text-stone-600" />
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-stone-900">Sectoral Templates</h3>
          <span className="border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            PRO
          </span>
        </div>
        <p className="text-sm text-stone-600">
          Products designed for various industries.
        </p>
      </div>
      <div className={cn(cardBase, 'flex flex-col gap-3 p-4')}>
        <Palette className="size-8 text-stone-600" />
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-stone-900">Aligned with Figma</h3>
          <span className="border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            PRO
          </span>
        </div>
        <p className="text-sm text-stone-600">
          Figma file consistently updated for compatibility.
        </p>
      </div>
    </div>
  )
}

function UserProfileNavCard() {
  return (
    <div className={cn(cardBase, 'flex w-64 flex-col gap-4 p-4')}>
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          <AvatarImage src="" alt="James Brown" />
          <AvatarFallback className="bg-stone-200 text-stone-700">JB</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">James Brown</span>
            <span className="border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              PRO
            </span>
          </div>
          <p className="truncate text-sm text-stone-500">james@alignul.com</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-y border-stone-100 py-3">
        <span className="text-sm text-stone-700">Dark Mode</span>
        <Switch defaultChecked={false} />
      </div>
      <nav className="flex flex-col gap-0">
        <a
          href="#activity"
          className="py-2 text-sm text-stone-700 hover:text-stone-900"
        >
          Activity
        </a>
        <a
          href="#integrations"
          className="flex items-center justify-between py-2 text-sm text-stone-700 hover:text-stone-900"
        >
          Integrations
          <ChevronRight className="size-4 text-stone-400" />
        </a>
        <a
          href="#settings"
          className="py-2 text-sm text-stone-700 hover:text-stone-900"
        >
          Settings
        </a>
        <a
          href="#add-account"
          className="py-2 text-sm text-stone-700 hover:text-stone-900"
        >
          + Add Account
        </a>
        <a
          href="#logout"
          className="border-t border-stone-100 pt-2 text-sm text-stone-700 hover:text-stone-900"
        >
          Logout
        </a>
      </nav>
      <p className="text-[10px] text-stone-400">v.1.5.69 Terms & Conditions</p>
    </div>
  )
}

function SocialInteractionBar() {
  return (
    <div className={cn(cardBase, 'flex w-fit gap-0')}>
      <button
        type="button"
        className="flex items-center gap-2 border-r border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        <Heart className="size-4" />
        Like
      </button>
      <button
        type="button"
        className="flex items-center gap-2 border-r border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        <MessageCircle className="size-4" />
        Comment
      </button>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        <Share2 className="size-4" />
        Share
      </button>
    </div>
  )
}

function SmallUserProfileCard() {
  return (
    <div className={cn(cardBase, 'w-64 p-4')}>
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          <AvatarImage src="" alt="Sophia Williams" />
          <AvatarFallback className="bg-stone-200 text-stone-700">SW</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900">Sophia Williams</span>
            <button
              type="button"
              className="p-1 text-stone-400 hover:text-stone-600"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-sm text-stone-500">HR Assistant @snergy</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="mt-4 w-full border-stone-300"
      >
        + Add Contact
      </Button>
    </div>
  )
}

function AppliedFiltersCard() {
  return (
    <div className={cn(cardBase, 'w-64 p-4')}>
      <h3 className="mb-3 text-sm font-semibold text-stone-900">
        Applied Filters
      </h3>
      <ul className="space-y-2 text-sm text-stone-600">
        <li className="flex items-center justify-between gap-2">
          <span>Category</span>
          <span className="font-medium text-stone-800">Design</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Status</span>
          <span className="font-medium text-stone-800">Active</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Date range</span>
          <span className="font-medium text-stone-800">Last 30 days</span>
        </li>
      </ul>
    </div>
  )
}

function PdfUploadCard() {
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-stone-900">
          2024-my-portfolio.pdf
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">20%</span>
          <button
            type="button"
            className="p-1 text-stone-400 hover:text-stone-600"
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 border border-stone-200 bg-stone-50 p-3">
        <div className="flex size-10 items-center justify-center border border-stone-300 bg-white">
          <span className="text-xs font-medium text-stone-500">PDF</span>
        </div>
        <span className="text-sm text-stone-600">
          0.4 KB of 0.8 KB
        </span>
      </div>
      <Progress value={20} className="mt-3 h-2 rounded-none [&_[data-slot=progress-indicator]]:rounded-none" />
    </div>
  )
}

function InviteToProjectCard() {
  return (
    <div className={cn(cardBase, 'w-96 p-4')}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-stone-500" />
          <h3 className="font-semibold text-stone-900">Invite to Project</h3>
        </div>
        <button
          type="button"
          className="p-1 text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mb-4 text-sm text-stone-600">
        Collaborate with members on this project.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Email address..."
          className="max-w-[180px] border-stone-300"
        />
        <Select defaultValue="view">
          <SelectTrigger className="w-[110px] border-stone-300">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">can view</SelectItem>
            <SelectItem value="edit">can edit</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm">Invite</Button>
      </div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Members with access
      </div>
      <ul className="space-y-2">
        {[
          { name: 'Juma Omondi', email: 'juma@example.com' },
          { name: 'Arthur Taylor', email: 'arthur@example.com' },
          { name: 'Laura Perez', email: 'laura@example.com' },
        ].map((m) => (
          <li
            key={m.email}
            className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-stone-200 text-xs text-stone-600">
                  {m.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-stone-900">{m.name}</div>
                <div className="text-xs text-stone-500">{m.email}</div>
              </div>
            </div>
            <Select defaultValue="view">
              <SelectTrigger className="h-8 w-[100px] border-stone-300 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">can view</SelectItem>
                <SelectItem value="edit">can edit</SelectItem>
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 border border-stone-200 bg-stone-50 p-2">
        <Link2 className="size-4 shrink-0 text-stone-500" />
        <span className="text-xs text-stone-600">
          Members who have the link have access to this project.
        </span>
        <ChevronDown className="size-4 shrink-0 text-stone-400" />
      </div>
    </div>
  )
}

function ContactInformationCard() {
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-stone-900">Contact Information</h3>
        <a href="#profile" className="text-sm text-stone-600 hover:underline">
          View Profile
        </a>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src="" alt="Lena Müller" />
          <AvatarFallback className="bg-stone-200 text-stone-700">LM</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-stone-900">Lena Müller</div>
          <div className="text-sm text-stone-500">Berlin, Germany</div>
          <div className="text-sm text-stone-500">Product Designer</div>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordCard() {
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <div className="mb-3 flex items-center gap-2">
        <Lock className="size-4 text-stone-500" />
        <h3 className="font-semibold text-stone-900">Reset Password</h3>
      </div>
      <p className="mb-4 text-sm text-stone-600">
        Enter your email to reset your password.
      </p>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Email Address*
        </label>
        <Input
          type="email"
          placeholder="hello@alignul.com"
          className="border-stone-300"
        />
      </div>
      <Button className="w-full bg-stone-800 hover:bg-stone-900">
        Reset Password
      </Button>
      <p className="mt-4 text-center text-sm text-stone-500">
        Don&apos;t have access anymore?{' '}
        <a href="#another" className="text-stone-700 hover:underline">
          Try another method
        </a>
      </p>
    </div>
  )
}

function AddTagsCard() {
  const tags = ['Digital Painting', 'Retrowave', 'NFT']
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-semibold text-stone-900">Add Tags (max. 8)</h3>
        <button
          type="button"
          className="p-0.5 text-stone-400 hover:text-stone-600"
          aria-label="Info"
        >
          <Info className="size-4" />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-2 border border-stone-300 bg-white">
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center border-r border-stone-300 text-stone-500 hover:bg-stone-50"
          aria-label="Add"
        >
          <span className="text-lg leading-none">+</span>
        </button>
        <input
          type="text"
          placeholder="Add tags..."
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-stone-400"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 border border-stone-200 bg-stone-50 px-2 py-1 text-sm text-stone-700"
          >
            {tag}
            <button
              type="button"
              className="p-0.5 text-stone-400 hover:text-stone-600"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function MembersWithAccessSettingsCard() {
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <h3 className="mb-4 font-semibold text-stone-900">Members with access</h3>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox defaultChecked />
          <span className="text-sm text-stone-700">Display on profile</span>
          <span className="border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
            New
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox />
          <span className="text-sm text-stone-700">Disable commenting</span>
        </label>
      </div>
    </div>
  )
}

function AddToPortfolioCard() {
  return (
    <div className={cn(cardBase, 'w-80 p-4')}>
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-stone-900">
          Add to portfolio
        </div>
        <Button variant="outline" className="border-stone-300">
          Choose
        </Button>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-stone-900">
          Add Download File
        </div>
        <Button variant="outline" className="border-stone-300">
          Add
        </Button>
      </div>
    </div>
  )
}

export function UiCardsReference46Demo() {
  return (
    <div className="space-y-8 bg-stone-100 p-6">
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
          Top row
        </h2>
        <TopRowCards />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Left column
          </h2>
          <UserProfileNavCard />
          <SocialInteractionBar />
          <SmallUserProfileCard />
          <AppliedFiltersCard />
        </div>
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Middle column
          </h2>
          <PdfUploadCard />
          <InviteToProjectCard />
          <ContactInformationCard />
        </div>
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Right column
          </h2>
          <ResetPasswordCard />
          <AddTagsCard />
          <MembersWithAccessSettingsCard />
          <AddToPortfolioCard />
        </div>
      </div>
    </div>
  )
}
