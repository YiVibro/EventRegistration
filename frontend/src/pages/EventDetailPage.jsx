import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle, Ticket } from 'lucide-react'
import { eventsApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { CategoryBadge, StatusBadge, CapacityBar, Input, Select, Toast, Skeleton } from '../components/ui'
import { clsx } from 'clsx'

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical',
  'Electrical', 'Information Technology', 'Biotechnology', 'MBA', 'MCA', 'Other'
]
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'PhD']

const INIT_FORM = { name: '', email: '', phone: '', department: '', year: '', rollNumber: '' }
const INIT_ERRORS = { name: '', email: '', phone: '', department: '', year: '', rollNumber: '' }

export default function EventDetailPage() {
  const { id } = useParams()

  const fetcher = useCallback(() => eventsApi.get(id), [id])
  const { data: event, loading, error } = useFetch(fetcher, [id])

  const [form,    setForm]    = useState(INIT_FORM)
  const [errors,  setErrors]  = useState(INIT_ERRORS)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(null)
  const [toast,      setToast]      = useState(null)

  const validate = () => {
    const e = { ...INIT_ERRORS }
    let ok = true
    if (!form.name.trim())       { e.name = 'Full name is required'; ok = false }
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { e.email = 'Valid email required'; ok = false }
    if (!form.phone.match(/^\d{10}$/)) { e.phone = '10-digit phone number required'; ok = false }
    if (!form.department)        { e.department = 'Department is required'; ok = false }
    if (!form.year)              { e.year = 'Year is required'; ok = false }
    if (!form.rollNumber.trim()) { e.rollNumber = 'Roll number is required'; ok = false }
    setErrors(e)
    return ok
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const { data } = await eventsApi.register(id, form)
      setSuccess(data.registration)
      setForm(INIT_FORM)
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Registration failed. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-8 w-3/4 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-red-400 font-body">{error}</p>
      <Link to="/" className="btn-secondary mt-4 inline-flex">← Back to Events</Link>
    </div>
  )

  if (!event) return null

  const isFull = event.registered >= event.capacity
  const date   = new Date(event.date)

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-raised border border-emerald-800 rounded-2xl p-8 text-center animate-fade-up">
        <div className="w-16 h-16 bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">You're registered!</h2>
        <p className="text-ink-400 font-body text-sm mb-6">{event.title}</p>

        <div className="bg-ink-950 rounded-xl p-4 border border-surface-border text-left space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-ink-500 font-mono">Name</span>
            <span className="text-white font-body">{success.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500 font-mono">Email</span>
            <span className="text-white font-body">{success.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-ink-500 font-mono flex items-center gap-1">
              <Ticket size={11} /> Ticket ID
            </span>
            <span className="text-amber-400 font-mono font-bold text-xs tracking-widest">{success.ticketId}</span>
          </div>
        </div>

        <Link to="/" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <ArrowLeft size={14} /> Browse More Events
        </Link>
      </div>
    </div>
  )

  // ── Normal view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        All Events
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ── Left: Event Info ── */}
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={event.category} />
            <StatusBadge status={event.status} />
            {event.tags?.map((tag) => (
              <span key={tag} className="badge bg-ink-900 text-ink-400 border border-surface-border">#{tag}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-4xl text-white leading-tight">
            {event.title}
          </h1>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: 'Date & Time', value: `${format(date, 'MMMM d, yyyy')} · ${format(date, 'h:mm a')}` },
              { icon: MapPin,   label: 'Venue',       value: event.venue },
              { icon: Users,    label: 'Capacity',    value: `${event.registered} / ${event.capacity} registered` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-ink-950 border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-mono text-ink-500 mb-1.5">
                  <Icon size={11} />
                  {label}
                </div>
                <p className="text-sm font-body text-white">{value}</p>
              </div>
            ))}

            <div className="bg-ink-950 border border-surface-border rounded-xl p-4 col-span-2">
              <p className="text-xs font-mono text-ink-500 mb-2">Availability</p>
              <CapacityBar registered={event.registered || 0} capacity={event.capacity} />
            </div>
          </div>

          {/* Description */}
          <div className="prose-custom">
            <h2 className="text-xs font-mono text-ink-500 uppercase tracking-widest mb-3">About this event</h2>
            <p className="text-ink-300 font-body leading-relaxed">{event.description}</p>
          </div>
        </div>

        {/* ── Right: Registration Form ── */}
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="sticky top-24 bg-surface-raised border border-surface-border rounded-2xl p-6">
            <h2 className="font-display font-bold text-xl text-white mb-1">
              {isFull ? 'Event Full' : 'Register Now'}
            </h2>
            <p className="text-xs font-mono text-ink-500 mb-6">
              {isFull ? 'This event has reached capacity.' : 'Fill in your details to secure your spot.'}
            </p>

            {isFull ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">😔</p>
                <p className="text-sm font-body text-ink-400">Check back for future events or join the waitlist.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange('name')}
                  error={errors.name}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={errors.email}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  error={errors.phone}
                />
                <Select
                  label="Department"
                  value={form.department}
                  onChange={handleChange('department')}
                  error={errors.department}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </Select>
                <Select
                  label="Year of Study"
                  value={form.year}
                  onChange={handleChange('year')}
                  error={errors.year}
                >
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </Select>
                <Input
                  label="Roll Number"
                  placeholder="e.g. CS2021003"
                  value={form.rollNumber}
                  onChange={handleChange('rollNumber')}
                  error={errors.rollNumber}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                      </svg>
                      Registering…
                    </span>
                  ) : (
                    <>
                      <Ticket size={14} />
                      Confirm Registration
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] font-mono text-ink-600 pt-1">
                  You'll receive your ticket ID on submission
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}