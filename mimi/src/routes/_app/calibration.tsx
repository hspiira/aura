import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/calibration')({
  component: CalibrationPage,
})

function CalibrationPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-stone-900">Calibration</h1>
      <p className="mt-1 text-sm text-stone-500">Calibration sessions and analytics.</p>
    </div>
  )
}
