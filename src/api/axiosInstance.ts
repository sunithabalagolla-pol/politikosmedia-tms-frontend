import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // always send httpOnly cookie
})

// Response interceptor — handle 401 (session expired / no cookie)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''

      // Don't redirect if the 401 came from auth endpoints — callers handle those
      const isAuthCall =
        url.includes('/auth/admin-login') ||
        url.includes('/auth/me') ||
        url.includes('/auth/logout')

      if (isAuthCall) return Promise.reject(error)

      const message = error.response?.data?.message || ''
      const isDeactivated = message.toLowerCase().includes('deactivated')

      // Clear any cached user state
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')
      localStorage.removeItem('login_method')

      if (isDeactivated) {
        localStorage.setItem('deactivated_message', message)
      } else {
        localStorage.setItem('auth_message', 'Your session expired. Please sign in again.')
      }

      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
