import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar, Shield, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function Navbar() {
  const { isLoggedIn, logout, admin } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = isLoggedIn
    ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/events', label: 'Events' },
        { to: '/admin/registrations', label: 'Registrations' },
      ]
    : [
        { to: '/', label: 'Events' },
      ]

  return (
    <header className="sticky top-0 z-40 bg-ink-950/80 backdrop-blur-lg border-b border-surface-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={isLoggedIn ? '/admin' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-ink-600 rounded-lg flex items-center justify-center group-hover:bg-ink-500 transition-colors">
            <Calendar size={16} className="text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white tracking-tight">Event</span>
            <span className="font-display font-bold text-amber-400 tracking-tight">Sphere</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200',
                isActive(to)
                  ? 'bg-ink-800 text-white'
                  : 'text-ink-300 hover:text-white hover:bg-ink-900'
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ink-900 rounded-lg border border-surface-border">
                <Shield size={12} className="text-amber-400" />
                <span className="text-xs font-mono text-ink-300">{admin?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-400 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              className="flex items-center gap-2 text-xs font-mono text-ink-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-surface-border hover:border-ink-600"
            >
              <Shield size={12} />
              Admin
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-ink-400 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-ink-950 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'block px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-colors',
                  isActive(to) ? 'bg-ink-800 text-white' : 'text-ink-300'
                )}
              >
                {label}
              </Link>
            ))}
            {isLoggedIn ? (
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm text-ink-400"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}