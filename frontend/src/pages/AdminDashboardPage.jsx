import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, TrendingUp, XCircle, ArrowRight } from 'lucide-react'
import { adminApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { Skeleton, EmptyState } from '../components/ui'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 card-glow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-20 rounded mb-2" />
        : <p className="font-display font-bold text-3xl text-white mb-1">{value ?? '—'}</p>
      }
      <p className="text-sm font-body text-ink-400">{label}</p>
      {sub && <p className="text-xs font-mono text-ink-600 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { admin } = useAuth()
  const fetcher = useCallback(() => adminApi.stats(), [])
  const { data: stats, loading, error } = useFetch(fetcher, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 animate-fade-up">
        <div>
          <p className="text-xs font-mono text-ink-500 mb-1">Welcome back,</p>
          <h1 className="font-display font-bold text-3xl text-white">{admin?.name}</h1>
        </div>
        <Link to="/admin/events/new" className="btn-primary text-sm flex items-center gap-2">
          + New Event
        </Link>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard icon={Calendar} label="Total Events"      color="bg-ink-600"      value={stats?.totalEvents}         loading={loading} />
        <StatCard icon={Users}    label="Registrations"     color="bg-emerald-700"  value={stats?.totalRegistrations}  loading={loading} />
        <StatCard icon={TrendingUp} label="Upcoming Events" color="bg-amber-700"    value={stats?.upcomingEvents}      loading={loading} />
        <StatCard icon={XCircle}  label="Cancelled"         color="bg-red-900"      value={stats?.cancelledEvents}     loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top events */}
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-white">Top Events</h2>
            <Link to="/admin/events" className="text-xs font-mono text-ink-500 hover:text-white transition-colors flex items-center gap-1">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : stats?.topEvents?.length > 0 ? (
            <div className="space-y-2">
              {stats.topEvents.map((event, i) => {
                const pct = Math.round((event.registered / event.capacity) * 100)
                return (
                  <Link
                    key={event.id}
                    to={`/admin/events/${event.id}/registrations`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-900 transition-colors group"
                  >
                    <span className="font-mono text-xs text-ink-600 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-white truncate group-hover:text-amber-400 transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-ink-900 rounded-full overflow-hidden">
                          <div className="h-full bg-ink-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-ink-500 shrink-0">
                          {event.registered}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState icon="📅" title="No events yet" description="Create your first event to see stats here." />
          )}
        </div>

        {/* Events by category */}
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display font-bold text-lg text-white mb-5">Events by Category</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : stats?.eventsByCategory?.length > 0 ? (
            <div className="space-y-3">
              {stats.eventsByCategory.map(({ _id: cat, count }) => {
                const max = stats.eventsByCategory[0]?.count || 1
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-ink-300">{cat || 'Uncategorized'}</span>
                      <span className="text-ink-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-ink-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink-500 rounded-full transition-all duration-700"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon="📊" title="No data yet" description="Stats appear once events are created." />
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {[
          { to: '/admin/events',        label: 'Manage Events',       desc: 'Create, edit, delete events' },
          { to: '/admin/registrations', label: 'All Registrations',   desc: 'View & search attendees' },
          { to: '/admin/events/new',    label: 'Create New Event',    desc: 'Add a new campus event' },
        ].map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between p-4 bg-ink-950 border border-surface-border
                       rounded-xl hover:border-ink-600 transition-colors group"
          >
            <div>
              <p className="text-sm font-body font-medium text-white">{label}</p>
              <p className="text-xs font-mono text-ink-600 mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={14} className="text-ink-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}