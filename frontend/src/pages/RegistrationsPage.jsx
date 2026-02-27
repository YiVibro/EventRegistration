import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Search, Download, User, Mail, Phone, BookOpen } from 'lucide-react'
import { adminApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import { Skeleton, EmptyState } from '../components/ui'

function exportCSV(registrations, filename = 'registrations.csv') {
  const headers = ['Name', 'Email', 'Phone', 'Department', 'Year', 'Roll Number', 'Ticket ID', 'Registered At']
  const rows = registrations.map((r) => [
    r.name, r.email, r.phone, r.department, r.year, r.rollNumber, r.ticketId,
    format(new Date(r.registeredAt), 'yyyy-MM-dd HH:mm')
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function RegistrationsPage() {
  const { id } = useParams()  // if undefined → all registrations
  const [search, setSearch] = useState('')
  const [query,  setQuery]  = useState({})

  const fetcher = useCallback(
    () => id
      ? adminApi.registrations.byEvent(id)
      : adminApi.registrations.all(query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, JSON.stringify(query)]
  )

  const { data, loading, error } = useFetch(fetcher, [id, JSON.stringify(query)])

  const registrations = data?.registrations || []
  const eventTitle    = data?.event?.title

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(search ? { search } : {})
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
        <div>
          {id && (
            <Link
              to="/admin/events"
              className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              Events
            </Link>
          )}
          <p className="text-xs font-mono text-ink-500">{id ? 'Event Registrations' : 'All Registrations'}</p>
          <h1 className="font-display font-bold text-3xl text-white">
            {eventTitle || (id ? 'Registrations' : 'All Attendees')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!loading && registrations.length > 0 && (
            <button
              onClick={() => exportCSV(registrations, `${eventTitle || 'registrations'}.csv`)}
              className="btn-secondary text-sm flex items-center gap-2 px-4 py-2.5"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Search (only for all registrations) */}
      {!id && (
        <form onSubmit={handleSearch} className="flex gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or roll no."
              className="input-field pl-10 h-10 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary h-10 px-5 text-sm">Search</button>
        </form>
      )}

      {/* Count */}
      {!loading && (
        <p className="text-xs font-mono text-ink-600 mb-4 animate-fade-in">
          {data?.total ?? registrations.length} registration{registrations.length !== 1 ? 's' : ''}
        </p>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No registrations yet"
          description="Registrations will appear here once students sign up."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3 stagger-children">
            {registrations.map((reg) => (
              <div key={reg.id} className="bg-surface-raised border border-surface-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-body font-medium text-white">{reg.name}</p>
                    <p className="text-xs font-mono text-amber-400 mt-0.5">{reg.ticketId}</p>
                  </div>
                  <span className="text-[10px] font-mono text-ink-600">
                    {format(new Date(reg.registeredAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { icon: Mail, value: reg.email },
                    { icon: Phone, value: reg.phone },
                    { icon: BookOpen, value: `${reg.department} · ${reg.year}` },
                    { icon: User, value: reg.rollNumber },
                  ].map(({ icon: Icon, value }) => (
                    <div key={value} className="flex items-center gap-2 text-xs font-mono text-ink-400">
                      <Icon size={11} className="text-ink-600 shrink-0" />
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface-raised border border-surface-border rounded-2xl overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Name', 'Email', 'Phone', 'Department', 'Roll No.', 'Ticket ID', 'Registered'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-mono text-ink-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-ink-900/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-body text-white">{reg.name}</p>
                        <p className="text-xs font-mono text-ink-600">{reg.year}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-ink-400">{reg.email}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-ink-400">{reg.phone}</td>
                      <td className="px-5 py-3.5 text-xs font-body text-ink-300">{reg.department}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-ink-400">{reg.rollNumber}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-amber-400 bg-amber-950/50 px-2 py-1 rounded-md border border-amber-900">
                          {reg.ticketId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-ink-600">
                        {format(new Date(reg.registeredAt), 'MMM d · h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}