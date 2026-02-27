import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { CategoryBadge, StatusBadge, CapacityBar } from './ui'
import { clsx } from 'clsx'

export default function EventCard({ event, index = 0 }) {
  const isFull = event.registered >= event.capacity
  const date = new Date(event.date)

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-surface-raised border border-surface-border rounded-2xl overflow-hidden card-glow"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Top accent line */}
      <div className={clsx(
        'h-0.5 w-full',
        event.category === 'Technical' && 'bg-gradient-to-r from-blue-600 to-blue-400',
        event.category === 'Cultural'  && 'bg-gradient-to-r from-purple-600 to-purple-400',
        event.category === 'Sports'    && 'bg-gradient-to-r from-green-600 to-green-400',
        event.category === 'Academic'  && 'bg-gradient-to-r from-amber-600 to-amber-400',
        event.category === 'Workshop'  && 'bg-gradient-to-r from-rose-600 to-rose-400',
        !['Technical','Cultural','Sports','Academic','Workshop'].includes(event.category)
          && 'bg-gradient-to-r from-ink-600 to-ink-400',
      )} />

      <div className="p-6 space-y-4">
        {/* Badges */}
        <div className="flex items-center justify-between">
          <CategoryBadge category={event.category} />
          <StatusBadge status={event.status} />
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-xl text-white leading-tight
                       group-hover:text-amber-400 transition-colors duration-200 line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm font-body text-ink-400 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        {/* Meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-400">
            <Calendar size={12} className="shrink-0 text-ink-500" />
            <span>{format(date, 'EEE, MMM d yyyy')} · {format(date, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-400">
            <MapPin size={12} className="shrink-0 text-ink-500" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Capacity */}
        <CapacityBar registered={event.registered || 0} capacity={event.capacity} />

        {/* CTA */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-ink-500">
            <Users size={11} />
            <span>{event.capacity} capacity</span>
          </div>
          <span className={clsx(
            'flex items-center gap-1.5 text-xs font-mono font-medium transition-all duration-200',
            isFull
              ? 'text-red-400'
              : 'text-ink-400 group-hover:text-amber-400 group-hover:gap-2.5'
          )}>
            {isFull ? 'Full' : 'Register'}
            {!isFull && <ArrowRight size={12} />}
          </span>
        </div>
      </div>
    </Link>
  )
}