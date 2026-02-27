import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { reviewSessionDetailQueryOptions, usersQueryOptions } from '#/lib/queries'

export const Route = createFileRoute('/_app/reviews/$id')({
  component: ReviewSessionDetailPage,
})

function ReviewSessionDetailPage() {
  const { id } = Route.useParams()
  const { data: session, isPending } = useQuery(reviewSessionDetailQueryOptions(id))
  const { data: usersData } = useQuery(usersQueryOptions({ limit: 500 }))
  const users = usersData?.items ?? []
  const userById = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return (
    <div className="space-y-4">
      <Link
        to="/reviews"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" />
        Back to review sessions
      </Link>
      {isPending && (
        <p className="text-sm text-stone-500">Loading…</p>
      )}
      {!isPending && session && (
        <div className="border border-stone-200 bg-white p-4">
          <h1 className="text-lg font-semibold text-stone-900">
            Review session
          </h1>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-stone-500">Employee</dt>
              <dd className="font-medium text-stone-900">
                {userById[session.user_id] ?? session.user_id}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Reviewer</dt>
              <dd className="font-medium text-stone-900">
                {userById[session.reviewer_id] ?? session.reviewer_id}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Type</dt>
              <dd className="font-medium text-stone-900">
                {session.session_type === 'mid_year' ? 'Mid-year' : 'Final'}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd className="font-medium capitalize text-stone-900">
                {session.status.replace('_', ' ')}
              </dd>
            </div>
            {session.scheduled_at && (
              <div>
                <dt className="text-stone-500">Scheduled</dt>
                <dd className="font-medium text-stone-900">
                  {new Date(session.scheduled_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
