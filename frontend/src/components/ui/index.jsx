import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect, useState } from 'react'

// ── Badge ─────────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Technical:   'bg-blue-950 text-blue-300 border border-blue-800',
  Cultural:    'bg-purple-950 text-purple-300 border border-purple-800',
  Sports:      'bg-green-950 text-green-300 border border-green-800',
  Academic:    'bg-amber-950 text-amber-300 border border-amber-800',
  Workshop:    'bg-rose-950 text-rose-300 border border-rose-800',
  Social:      'bg-pink-950 text-pink-300 border border-pink-800',
  Other:       'bg-slate-800 text-slate-300 border border-slate-700',
}

const STATUS_COLORS = {
  upcoming:   'bg-emerald-950 text-emerald-400 border border-emerald-800',
  ongoing:    'bg-blue-950 text-blue-400 border border-blue-800',
  completed:  'bg-slate-800 text-slate-400 border border-slate-700',
  cancelled:  'bg-red-950 text-red-400 border border-red-800',
}

export function CategoryBadge({ category }) {
  return (
    <span className={clsx('badge', CATEGORY_COLORS[category] || CATEGORY_COLORS.Other)}>
      {category}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={clsx('badge uppercase tracking-widest text-[10px]', STATUS_COLORS[status] || STATUS_COLORS.upcoming)}>
      {status}
    </span>
  )
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />
}

export function EventCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-4">
      <Skeleton className="h-4 w-20 rounded-full" />
      <Skeleton className="h-6 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="pt-2 flex justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

// ── Toast Notification ────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error:   <AlertCircle size={16} className="text-red-400 shrink-0" />,
  info:    <Info size={16} className="text-blue-400 shrink-0" />,
}

export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl',
      'border backdrop-blur-sm animate-fade-up max-w-sm',
      type === 'success' && 'bg-emerald-950/90 border-emerald-800',
      type === 'error'   && 'bg-red-950/90 border-red-800',
      type === 'info'    && 'bg-ink-900/90 border-ink-700',
    )}>
      {TOAST_ICONS[type]}
      <p className="text-sm font-body text-white flex-1">{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Capacity Bar ──────────────────────────────────────────────────────────────
export function CapacityBar({ registered, capacity }) {
  const pct = Math.min(100, Math.round((registered / capacity) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono text-ink-400">
        <span>{registered} registered</span>
        <span>{capacity - registered} spots left</span>
      </div>
      <div className="h-1.5 bg-ink-900 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-xl text-white mb-2">{title}</h3>
      <p className="text-ink-400 font-body text-sm max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <svg
      className="animate-spin text-ink-400"
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono text-ink-400 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input className={clsx('input-field', error && 'border-red-500 focus:ring-red-500', className)} {...props} />
      {error && <p className="text-xs text-red-400 font-body">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono text-ink-400 uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'input-field appearance-none cursor-pointer',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400 font-body">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono text-ink-400 uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        className={clsx('input-field resize-none', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400 font-body">{error}</p>}
    </div>
  )
}