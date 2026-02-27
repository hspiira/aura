import { useState } from 'react'
import {
  FileText,
  Monitor,
  Palette,
  Play,
  Server,
  Sparkles,
  User,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '#/components/ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'

const TEAM_TAGS = [
  { label: 'Design team', icon: Palette },
  { label: 'Backend devs', icon: Server },
  { label: 'Frontend devs', icon: Monitor },
] as const

const AI_SUMMARY_TEXT = `During our recent design sprint call, we focused on brainstorming innovative solutions to enhance user engagement. The team shared various ideas, emphasizing the importance of user feedback and iterative design processes.

We explored potential features that could streamline user interactions and improve overall satisfaction. Additionally, we outlined the next steps for prototyping and testing our concepts. Each team member was assigned specific tasks to ensure we stay on track for our upcoming deadlines. Overall, the call was productive and aligned everyone on priorities.`

export function SprintCallRecording() {
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)

  return (
    <div className="rounded-2xl bg-stone-200/60 p-8 md:p-12">
      {/* Header pill */}
      <p className="mb-8 text-center">
        <span className="rounded-full bg-stone-300/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-600">
          Agency Sprint Call Recording – Light Mode
        </span>
      </p>

      {/* Main card */}
      <Card className="mx-auto max-w-2xl border-stone-200 bg-white shadow-lg">
        <CardHeader className="gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-stone-900 md:text-2xl">
            Sprint 203 daily – [Project-238]
          </CardTitle>

          {/* Team tags */}
          <div className="flex flex-wrap gap-2">
            {TEAM_TAGS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-sm text-stone-800"
              >
                <Icon className="size-3.5 text-stone-500" />
                {label}
              </span>
            ))}
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-2">
            <AvatarGroup className="flex">
              <Avatar size="sm">
                <AvatarFallback className="bg-amber-200 text-amber-800">
                  JD
                </AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback className="bg-emerald-200 text-emerald-800">
                  MK
                </AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback className="bg-sky-200 text-sky-800">
                  PL
                </AvatarFallback>
              </Avatar>
              <AvatarGroupCount className="text-xs">+12</AvatarGroupCount>
            </AvatarGroup>
            <span className="text-sm text-stone-600">
              were in attendance
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          {/* Call recording label + audio player */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-stone-900">
              Call Recording
            </h3>
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="flex w-full items-center gap-4 rounded-full bg-stone-900 px-4 py-3 text-white transition hover:bg-stone-800"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Play
                  className={`size-5 ${playing ? 'hidden' : ''}`}
                  aria-hidden
                />
                <span
                  className={`size-5 ${playing ? 'flex' : 'hidden'} items-center justify-center gap-0.5`}
                  aria-hidden
                >
                  <span className="h-4 w-2 rounded-sm bg-white" />
                  <span className="h-4 w-2 rounded-sm bg-white" />
                </span>
              </span>
              {/* Waveform bars */}
              <div className="flex flex-1 items-end gap-0.5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-white/80"
                    style={{
                      height: `${20 + (i % 5) * 12}%`,
                      minHeight: 4,
                    }}
                  />
                ))}
              </div>
              <span className="tabular-nums text-sm">15:28</span>
              <span className="text-sm text-stone-400">1x</span>
            </button>
          </div>

          {/* Tabs: AI Summary / Full Transcript */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList variant="line" className="h-auto w-full justify-start gap-0 rounded-none border-b border-stone-200 bg-transparent p-0">
              <TabsTrigger
                value="summary"
                variant="line"
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2 pt-0 pr-4 data-[state=active]:border-stone-900 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 data-[state=active]:shadow-none"
              >
                <Sparkles className="mr-1.5 size-4 text-stone-600" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                variant="line"
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2 pt-0 pl-4 data-[state=active]:border-stone-900 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 data-[state=active]:shadow-none"
              >
                <FileText className="mr-1.5 size-4 text-stone-500" />
                Full Transcript
              </TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <div
                className={`text-sm leading-relaxed text-stone-700 ${!expanded ? 'line-clamp-5' : ''}`}
              >
                {AI_SUMMARY_TEXT}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                {expanded ? 'Read less' : 'Read more'}
              </button>
            </TabsContent>
            <TabsContent value="transcript" className="mt-4">
              <p className="text-sm text-stone-500">
                Full transcript would load here.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 flex justify-end gap-2">
        <span className="rounded-full bg-stone-300/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-600">
          Designed by PHE
        </span>
        <Avatar size="sm" className="ring-2 ring-dashed ring-pink-400">
          <AvatarFallback className="bg-pink-100 text-pink-700">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
