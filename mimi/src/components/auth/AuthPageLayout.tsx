/**
 * Shared layout for login/signup: full-screen dark background with overlay and grid (Vitalis-style).
 */
export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen flex flex-col bg-stone-950">
      {/* Soft overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-stone-950/80"
        aria-hidden
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.06]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 45%, rgb(41 37 36), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
