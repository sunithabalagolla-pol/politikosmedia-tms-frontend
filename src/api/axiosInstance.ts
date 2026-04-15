import axios from 'axios'
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalConfig, loginRequest } from '../config/msalConfig'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || ''
const IS_SSO_MODE = !!clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)

let msalInstance: PublicClientApplication | null = null
if (IS_SSO_MODE) {
  msalInstance = new PublicClientApplication(msalConfig)
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
axiosInstance.interceptors.request.use(async (config) => {
  // First check localStorage for dev token
  const storedToken = localStorage.getItem('token')
  if (storedToken) {
    config.headers.Authorization = `Bearer ${storedToken}`
    return config
  }

  // SSO mode: get token from MSAL
  if (IS_SSO_MODE && msalInstance) {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        config.headers.Authorization = `Bearer ${response.accessToken}`
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          try {
            const response = await msalInstance.acquireTokenPopup(loginRequest)
            config.headers.Authorization = `Bearer ${response.accessToken}`
          } catch {
            window.location.href = '/'
          }
        }
      }
    }
  }

  return config
})

// Response interceptor — handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Don't redirect if the 401 came from login endpoints — AuthContext handles those
      const isLoginCall = url.includes('/auth/login') || url.includes('/auth/dev-token')
      if (isLoginCall) return Promise.reject(error)

      const message = error.response?.data?.message || ''
      const isDeactivated = message.toLowerCase().includes('deactivated')

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')

      if (isDeactivated) {
        // Deactivation — no retry, no token refresh, immediate logout
        localStorage.setItem('deactivated_message', message)
      }
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
