import { createContext, useContext, useState, useCallback } from 'react'
import { adminApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('es_admin')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await adminApi.login({ email, password })
    localStorage.setItem('es_token', data.token)
    localStorage.setItem('es_admin', JSON.stringify(data.admin))
    setAdmin(data.admin)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('es_token')
    localStorage.removeItem('es_admin')
    setAdmin(null)
  }, [])

  return (
    <AuthContext.Provider value={{ admin, login, logout, isLoggedIn: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}