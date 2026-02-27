import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-stone-900">Admin</h1>
      <p className="mt-1 text-sm text-stone-500">Roles, permissions, and tokens.</p>
    </div>
  )
}
