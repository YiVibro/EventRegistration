import { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { eventsApi } from '../lib/api'
import { useFetch } from '../hooks/useFetch'
import EventCard from '../components/EventCard'
import { EventCardSkeleton, EmptyState } from '../components/ui'

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Social', 'Other']
const STATUSES   = [
  { value: '', label: 'All Status' },
  { value: 'upcoming',  label: 'Upcoming' },
  { value: 'ongoing',   label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]

export default function HomePage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [status,   setStatus]   = useState('')
  const [query,    setQuery]    = useState({})

  const fetcher = useCallback(
    () => eventsApi.list(query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(query)]
  )

  const { data, loading, error } = useFetch(fetcher, [JSON.stringify(query)])

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery({ search: search || undefined, category: category !== 'All' ? category : undefined, status: status || undefined })
  }

  const clearFilters = () => {
    setSearch(''); setCategory('All'); setStatus('')
    setQuery({})
  }

  const hasFilters = search || category !== 'All' || status

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 border-b border-surface-border">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
                        bg-ink-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink-900 border border-ink-700
                          rounded-full text-xs font-mono text-amber-400 mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            Live event registrations open
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl text-white leading-none tracking-tight mb-4 animate-fade-up">
            Campus <span className="text-gradient">Events</span>
          </h1>
          <p className="font-body text-ink-400 text-lg max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Discover workshops, tech fests, cultural shows and more. Register with one click.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-ink-950/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="input-field pl-10 h-10 text-sm"
              />
            </div>

            {/* Category tabs (desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-ink-900 rounded-lg p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-150 ${
                    category === cat
                      ? 'bg-ink-600 text-white'
                      : 'text-ink-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Category select (mobile) */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="lg:hidden input-field h-10 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field h-10 text-sm w-full sm:w-40"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button type="submit" className="btn-primary h-10 px-5 text-sm flex items-center gap-2">
              <SlidersHorizontal size={14} />
              Filter
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-3 text-ink-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
              >
                <X size={14} /> Clear
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Events Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Result count */}
        {!loading && data && (
          <p className="text-xs font-mono text-ink-500 mb-6 animate-fade-in">
            {data.total} event{data.total !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-sm text-red-300 font-body">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        )}

        {/* Events */}
        {!loading && data?.events?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {data.events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && data?.events?.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No events found"
            description="Try adjusting your filters or check back later for new events."
            action={
              hasFilters && (
                <button onClick={clearFilters} className="btn-secondary text-sm px-5 py-2.5">
                  Clear filters
                </button>
              )
            }
          />
        )}
      </main>
    </div>
  )
}