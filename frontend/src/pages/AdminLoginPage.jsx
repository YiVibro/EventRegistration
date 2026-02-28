import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Input, Toast } from '../components/ui'

export default function AdminLoginPage() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [toast,    setToast]    = useState(null)

  if (isLoggedIn) return <Navigate to="/admin" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setToast({ message: 'Please enter email and password', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Login failed. Check credentials.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Background glow */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px]
                      bg-ink-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Card */}
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-ink-900 border border-ink-700 rounded-2xl flex items-center justify-center">
              <Shield size={24} className="text-amber-400" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Admin Portal</h1>
          <p className="text-center text-sm font-body text-ink-500 mb-8">
            EventSphere management dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-ink-400 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <Shield size={14} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-3 bg-ink-950 border border-surface-border rounded-lg">
            <p className="text-xs font-mono text-ink-600 text-center">
              Powered By:Yishith Vilas & Likhith Gowda
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}