import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { adminApi, eventsApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { Input, Select, Textarea, Toast, Skeleton } from '../components/ui'

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Social', 'Other']
const STATUSES   = ['upcoming', 'ongoing', 'completed', 'cancelled']

const BLANK = {
  title: '', description: '', date: '', venue: '',
  capacity: '', category: 'Technical', status: 'upcoming',
  image: '', tags: ''
}

export default function EventFormPage() {
  const { id }     = useParams()          // undefined = create mode
  const navigate   = useNavigate()
  const isEdit     = !!id

  const fetcher = useCallback(() => isEdit ? eventsApi.get(id) : null, [id, isEdit])
  const { data: existing, loading: loadingEvent } = useFetch(
    fetcher, [id],
  )

  const [form,     setForm]     = useState(BLANK)
  const [errors,   setErrors]   = useState({})
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)

  // Populate form when editing
  useEffect(() => {
    if (isEdit && existing) {
      const dateStr = existing.date
        ? new Date(existing.date).toISOString().slice(0, 16)
        : ''
      setForm({
        title:       existing.title       || '',
        description: existing.description || '',
        date:        dateStr,
        venue:       existing.venue       || '',
        capacity:    existing.capacity    || '',
        category:    existing.category    || 'Technical',
        status:      existing.status      || 'upcoming',
        image:       existing.image       || '',
        tags:        (existing.tags || []).join(', '),
      })
    }
  }, [existing, isEdit])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.date)               e.date        = 'Date is required'
    if (!form.venue.trim())       e.venue       = 'Venue is required'
    if (!form.capacity || isNaN(form.capacity) || Number(form.capacity) < 1)
      e.capacity = 'Valid capacity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      date:     new Date(form.date).toISOString(),
      tags:     form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      image:    form.image || null,
    }

    try {
      if (isEdit) {
        await adminApi.events.update(id, payload)
        setToast({ message: 'Event updated!', type: 'success' })
      } else {
        await adminApi.events.create(payload)
        setToast({ message: 'Event created!', type: 'success' })
      }
      setTimeout(() => navigate('/admin/events'), 1200)
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) {
        setToast({ message: serverErrors.join(' · '), type: 'error' })
      } else {
        setToast({ message: err.response?.data?.error || 'Save failed', type: 'error' })
      }
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loadingEvent) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <button
          onClick={() => navigate('/admin/events')}
          className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </button>
        <h1 className="font-display font-bold text-3xl text-white">
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xs font-mono text-ink-500 uppercase tracking-widest">Basic Info</h2>

          <Input
            label="Event Title"
            placeholder="e.g. Annual Tech Fest 2025"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
          />

          <Textarea
            label="Description"
            placeholder="Describe the event, what attendees can expect..."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={set('category')}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>

            {isEdit && (
              <Select
                label="Status"
                value={form.status}
                onChange={set('status')}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </Select>
            )}
          </div>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xs font-mono text-ink-500 uppercase tracking-widest">Logistics</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date & Time"
              type="datetime-local"
              value={form.date}
              onChange={set('date')}
              error={errors.date}
            />
            <Input
              label="Capacity"
              type="number"
              min="1"
              placeholder="e.g. 200"
              value={form.capacity}
              onChange={set('capacity')}
              error={errors.capacity}
            />
          </div>

          <Input
            label="Venue"
            placeholder="e.g. Main Auditorium, Block A"
            value={form.venue}
            onChange={set('venue')}
            error={errors.venue}
          />
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xs font-mono text-ink-500 uppercase tracking-widest">Optional</h2>

          <Input
            label="Image URL"
            placeholder="https://... (optional)"
            value={form.image}
            onChange={set('image')}
          />

          <Input
            label="Tags (comma separated)"
            placeholder="hackathon, coding, prizes"
            value={form.tags}
            onChange={set('tags')}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="btn-secondary flex-1 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                    strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <Save size={14} />
                {isEdit ? 'Save Changes' : 'Create Event'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}