/**
 * Error pages — brutalist/industrial aesthetic.
 * Fits entirely within a single viewport — no scroll.
 *
 * Rules:
 *   - NO rounded corners
 *   - NO box shadows
 *   - h-screen / overflow-hidden — zero scrolling
 *   - DM Mono display; code number is a full-bleed background watermark
 */

import { useRouter } from '@tanstack/react-router'

// ─── Shared shell ─────────────────────────────────────────────────────────────

interface ErrorShellProps {
  code: string
  headline: string
  subline: string
  detail?: string
  actions?: React.ReactNode
}

function ErrorShell({ code, headline, subline, detail, actions }: ErrorShellProps) {
  return (
    <div
      className="relative h-screen overflow-hidden bg-stone-950 text-stone-50"
      style={{ fontFamily: "'DM Mono', 'Cascadia Code', monospace" }}
    >
      {/* ── background grid ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.03) 59px, rgba(255,255,255,0.03) 60px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.03) 59px, rgba(255,255,255,0.03) 60px)',
        }}
      />

      {/* ── giant watermark code ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            fontSize: 'clamp(12rem, 40vw, 36rem)',
            letterSpacing: '-0.06em',
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.06)',
          }}
        >
          {code}
        </span>
      </div>

      {/* ── layout: header + body ─────────────────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col">

        {/* top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-stone-800 px-6 py-3 lg:px-10">
          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500">
            AURA / SYSTEM
          </span>
          <span className="text-[10px] tracking-[0.2em] text-stone-600">
            {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
          </span>
        </header>

        {/* body — fills remaining height, no scroll */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">

          {/* ── left: identity + actions ────────────────────────────── */}
          <div className="flex flex-col justify-center px-6 py-8 lg:px-10">
            <p className="mb-5 text-[10px] tracking-[0.35em] uppercase text-stone-600">
              ERROR / {code}
            </p>

            <h1
              className="mb-3 text-3xl font-bold leading-tight text-stone-50 lg:text-[2.6rem]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {headline}
            </h1>

            <p className="mb-8 max-w-sm text-sm leading-relaxed text-stone-500">
              {subline}
            </p>

            {actions && (
              <div className="flex flex-wrap gap-3">
                {actions}
              </div>
            )}
          </div>

          {/* vertical divider */}
          <div className="hidden bg-stone-800 lg:block" />

          {/* ── right: diagnostic ledger ────────────────────────────── */}
          <div className="flex flex-col justify-center px-6 py-8 lg:px-10">
            <p className="mb-4 text-[10px] tracking-[0.35em] uppercase text-stone-600">
              DIAGNOSTIC
            </p>

            <div className="border-t border-stone-800">
              <DiagRow label="STATUS" value={code} />
              <DiagRow label="TIMESTAMP" value={new Date().toISOString()} />
              <DiagRow
                label="PATH"
                value={typeof window !== 'undefined' ? window.location.pathname : '—'}
              />
              {detail && <DiagRow label="DETAIL" value={detail} />}
              <DiagRow label="APP" value="aura.dev" />
            </div>
          </div>
        </div>

        {/* bottom rule */}
        <footer className="shrink-0 border-t border-stone-800 px-6 py-3 lg:px-10">
          <p className="text-[9px] tracking-[0.25em] uppercase text-stone-700">
            If this persists — contact support ↗
          </p>
        </footer>
      </div>
    </div>
  )
}

// ─── Diagnostic row ───────────────────────────────────────────────────────────

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 border-b border-stone-800 py-2.5">
      <span className="w-24 shrink-0 text-[9px] tracking-[0.25em] uppercase text-stone-600">
        {label}
      </span>
      <span className="min-w-0 break-all text-[11px] text-stone-400">
        {value}
      </span>
    </div>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

function ErrorAction({
  onClick,
  href,
  children,
  primary,
}: {
  onClick?: () => void
  href?: string
  children: React.ReactNode
  primary?: boolean
}) {
  const base =
    'inline-flex items-center gap-2 border px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase transition-colors cursor-pointer'
  const variant = primary
    ? `${base} border-stone-50 bg-stone-50 text-stone-950 hover:bg-stone-200`
    : `${base} border-stone-700 bg-transparent text-stone-400 hover:border-stone-500 hover:text-stone-200`

  if (href) return <a href={href} className={variant}>{children}</a>
  return <button type="button" onClick={onClick} className={variant}>{children}</button>
}

// ─── 404 ─────────────────────────────────────────────────────────────────────

export function NotFoundPage() {
  const router = useRouter()

  return (
    <ErrorShell
      code="404"
      headline="Page not found."
      subline="The route you requested doesn't exist or has been moved. Check the URL or navigate to a known location."
      actions={
        <>
          <ErrorAction primary onClick={() => router.history.back()}>← Go back</ErrorAction>
          <ErrorAction href="/">Home</ErrorAction>
        </>
      }
    />
  )
}

// ─── 500 ─────────────────────────────────────────────────────────────────────

export function AppErrorPage({ error }: { error: unknown }) {
  const router = useRouter()

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unexpected error occurred.'

  return (
    <ErrorShell
      code="500"
      headline="Something broke."
      subline="An unhandled error stopped this page from rendering. The error has been logged."
      detail={message}
      actions={
        <>
          <ErrorAction primary onClick={() => router.invalidate()}>↺ Retry</ErrorAction>
          <ErrorAction onClick={() => router.history.back()}>← Go back</ErrorAction>
          <ErrorAction href="/">Home</ErrorAction>
        </>
      }
    />
  )
}
