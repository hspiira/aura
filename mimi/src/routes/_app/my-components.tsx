import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/my-components')({
  component: MyComponentsPage,
})

function MyComponentsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">My Components</h1>
        <p className="mt-1 text-sm text-stone-500">
          Add your custom components here to preview and iterate on them.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center text-stone-500">
        <p className="text-sm">No components yet. Add imports and render your components below.</p>
      </div>
    </div>
  )
}
