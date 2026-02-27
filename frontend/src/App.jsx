import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage            from './pages/HomePage'
import EventDetailPage     from './pages/EventDetailPage'
import AdminLoginPage      from './pages/AdminLoginPage'
import AdminDashboardPage  from './pages/AdminDashboardPage'
import AdminEventsPage     from './pages/AdminEventsPage'
import EventFormPage       from './pages/EventFormPage'
import RegistrationsPage   from './pages/RegistrationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* ── Public ── */}
            <Route path="/"              element={<HomePage />} />
            <Route path="/events/:id"    element={<EventDetailPage />} />
            <Route path="/admin/login"   element={<AdminLoginPage />} />

            {/* ── Admin (protected) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin"                                     element={<AdminDashboardPage />} />
              <Route path="/admin/events"                              element={<AdminEventsPage />} />
              <Route path="/admin/events/new"                          element={<EventFormPage />} />
              <Route path="/admin/events/:id/edit"                     element={<EventFormPage />} />
              <Route path="/admin/events/:id/registrations"            element={<RegistrationsPage />} />
              <Route path="/admin/registrations"                       element={<RegistrationsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-border py-5">
          <p className="text-center text-xs font-mono text-ink-700">
            EventSphere © {new Date().getFullYear()} · Campus Event Platform
          </p>
        </footer>
      </div>
      </AuthProvider>
    </BrowserRouter>
  )
}