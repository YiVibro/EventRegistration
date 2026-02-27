import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, Users, Eye, AlertTriangle } from 'lucide-react'
import { adminApi, eventsApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { CategoryBadge, StatusBadge, Skeleton, EmptyState, Toast } from '../components/ui'

function DeleteModal({ event, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-raised border border-red-800 rounded-2xl p-6 max-w-sm w-full animate-fade-up">
        <div className="w-12 h-12 bg-red-950 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <h3 className="font-display font-bold text-xl text-white mb-2">Delete Event?</h3>
        <p className="text-sm font-body text-ink-400 mb-6">
          <span className="text-white">{event.title}</span> and all its registrations will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminEventsPage() {
  const fetcher = useCallback(() => eventsApi.list({ limit: 100 }), [])
  const { data, loading, error, refetch } = useFetch(fetcher, [])

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [toast,        setToast]        = useState(null)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.events.delete(deleteTarget.id)
      setToast({ message: 'Event deleted successfully', type: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Delete failed', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {deleteTarget && (
        <DeleteModal
          event={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-xs font-mono text-ink-500 mb-1">Admin</p>
          <h1 className="font-display font-bold text-3xl text-white">Manage Events</h1>
        </div>
        <Link to="/admin/events/new" className="btn-primary text-sm flex items-center gap-2">
          <Plus size={14} /> New Event
        </Link>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : data?.events?.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No events yet"
          description="Create your first campus event to get started."
          action={
            <Link to="/admin/events/new" className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Create Event
            </Link>
          }
        />
      ) : (
        <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Event', 'Category', 'Date', 'Registrations', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-mono text-ink-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data?.events?.map((event) => (
                  <tr key={event.id} className="hover:bg-ink-900/40 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-sm font-body font-medium text-white truncate max-w-[200px]">
                        {event.title}
                      </p>
                      <p className="text-xs font-mono text-ink-600 truncate max-w-[200px]">{event.venue}</p>
                    </td>
                    <td className="px-5 py-4">
                      <CategoryBadge category={event.category} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono text-ink-300">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-ink-400">
                        <Users size={11} />
                        {event.registered}/{event.capacity}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/events/${event.id}`}
                          target="_blank"
                          className="p-1.5 text-ink-400 hover:text-white hover:bg-ink-800 rounded-lg transition-colors"
                          title="View public page"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          className="p-1.5 text-ink-400 hover:text-white hover:bg-ink-800 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <Link
                          to={`/admin/events/${event.id}/registrations`}
                          className="p-1.5 text-ink-400 hover:text-white hover:bg-ink-800 rounded-lg transition-colors"
                          title="View registrations"
                        >
                          <Users size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(event)}
                          className="p-1.5 text-ink-400 hover:text-red-400 hover:bg-red-950 rounded-lg transition-colors"
                          title="Delete event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}