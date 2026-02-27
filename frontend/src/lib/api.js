import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('es_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('es_token')
      localStorage.removeItem('es_admin')
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Public API ────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params) => api.get('/events', { params }),
  get:  (id)     => api.get(`/events/${id}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
}

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  login:   (data)       => api.post('/auth/login', data),
  stats:   ()           => api.get('/admin/stats'),
  events: {
    create: (data)      => api.post('/admin/events', data),
    update: (id, data)  => api.put(`/admin/events/${id}`, data),
    delete: (id)        => api.delete(`/admin/events/${id}`),
  },
  registrations: {
    byEvent: (id)       => api.get(`/admin/events/${id}/registrations`),
    all:     (params)   => api.get('/admin/registrations', { params }),
  },
}

export default api