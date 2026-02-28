import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/')({
  component: AdminIndexRedirect,
})

function AdminIndexRedirect() {
  return <Navigate to="/admin/users" />
}
