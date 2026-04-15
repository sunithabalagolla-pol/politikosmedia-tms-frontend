import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { loginRequest } from '../config/msalConfig'
import axiosInstance from '../api/axiosInstance'

// Backend returns "employee", frontend routes use "user" — map between them
export type UserRole = 'admin' | 'manager' | 'user'
export type ViewMode = 'manager' | 'employee'
type BackendRole = 'admin' | 'manager' | 'employee'

function mapBackendRole(backendRole: BackendRole): UserRole {
  if (backendRole === 'employee') return 'user'
  return backendRole as UserRole
}

interface User {
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isDevMode: boolean
  currentView: ViewMode
  availableViews: string[]
  canSwitchView: boolean
  switchView: (view: ViewMode) => void
  login: () => Promise<void>
  devLogin: (role: UserRole, customEmail?: string, customName?: string) => Promise<void>
  logout: () => void
  error: string | null
}

// Check if Azure credentials are configured
// Read from MSAL instance config (which was initialized from DB in main.tsx)
// If clientId is 'dev-mode' or not a valid UUID → dev mode
function checkIsDevMode(instance: any): boolean {
  try {
    const config = instance.getConfiguration?.()
    const clientId = config?.auth?.clientId || ''
    if (!clientId || clientId === 'dev-mode') return true
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
  } catch {
    return true
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDevMode: true,
  currentView: 'manager',
  availableViews: [],
  canSwitchView: false,
  switchView: () => {},
  login: async () => {},
  devLogin: async () => {},
  logout: () => {},
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance } = useMsal()
  const IS_DEV_MODE = checkIsDevMode(instance)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View switching — only manager/admin can switch to employee view
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    return (localStorage.getItem('currentView') as ViewMode) || 'manager'
  })
  const [availableViews, setAvailableViews] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('availableViews') || '[]') } catch { return [] }
  })

  const canSwitchView = availableViews.length > 1

  const switchView = useCallback((view: ViewMode) => {
    setCurrentView(view)
    localStorage.setItem('currentView', view)
  }, [])

  // Save user data to state + localStorage
  const saveUser = useCallback((userData: User, token?: string) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('userRole', userData.role)
    if (token) localStorage.setItem('token', token)
  }, [])

  // Clear all auth data
  const clearAuth = useCallback(() => {
    setUser(null)
    setCurrentView('manager')
    setAvailableViews([])
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    localStorage.removeItem('token')
    localStorage.removeItem('currentView')
    localStorage.removeItem('availableViews')
  }, [])

  // Call backend POST /api/auth/login with a token
  const loginWithBackend = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { token })
      const data = response.data.data || response.data
      const userData: User = {
        name: data.name,
        email: data.email,
        role: mapBackendRole(data.role),
      }
      
      // Save available_views from backend response
      const views = data.available_views || [data.role === 'employee' ? 'employee' : 'manager']
      setAvailableViews(views)
      localStorage.setItem('availableViews', JSON.stringify(views))
      
      // Set initial currentView based on role if not already set
      const storedView = localStorage.getItem('currentView')
      if (!storedView) {
        const initialView = userData.role === 'user' ? 'employee' : 'manager'
        setCurrentView(initialView)
        localStorage.setItem('currentView', initialView)
      }
      
      saveUser(userData, token)
      return userData
    } catch (err: any) {
      const msg = err?.response?.data?.message || ''
      if (msg.toLowerCase().includes('deactivated')) {
        localStorage.removeItem('deactivated_message')
        setError(msg)
      } else {
        setError('Failed to verify with server. Please try again.')
      }
      return null
    }
  }, [saveUser])

  // On mount: restore session from cache
  useEffect(() => {
    const initAuth = async () => {
      try {
        const cached = localStorage.getItem('user')
        const cachedToken = localStorage.getItem('token')
        if (cached && cachedToken) {
          try {
            const parsed = JSON.parse(cached) as User
            setUser(parsed)
            setIsLoading(false)
            return
          } catch {
            clearAuth()
          }
        }

        if (IS_DEV_MODE) {
          setIsLoading(false)
          return
        }

        // SSO mode: check MSAL accounts
        let currentAccounts: any[] = []
        try {
          currentAccounts = instance.getAllAccounts()
        } catch { /* MSAL not ready */ }

        if (currentAccounts.length > 0) {
          try {
            const tokenResponse = await instance.acquireTokenSilent({
              ...loginRequest,
              account: currentAccounts[0],
            })
            await loginWithBackend(tokenResponse.accessToken)
          } catch (err) {
            if (err instanceof InteractionRequiredAuthError) {
              clearAuth()
            }
          }
        }
      } catch { /* catch-all */ } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [instance, loginWithBackend, clearAuth])

  // SSO login (production — when Azure IDs are configured)
  const login = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const loginResponse = await instance.loginPopup(loginRequest)
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: loginResponse.account,
      })
      await loginWithBackend(tokenResponse.accessToken)
    } catch (err: any) {
      if (err.errorCode !== 'user_cancelled') {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [instance, loginWithBackend])

  // Dev login — hits real backend with dev-token flow
  const devLogin = useCallback(async (role: UserRole, customEmail?: string, customName?: string) => {
    setError(null)
    setIsLoading(true)

    const devAccounts: Record<UserRole, { email: string; name: string }> = {
      admin: { email: 'admin@politikos.in', name: 'Admin User' },
      manager: { email: 'manager@politikos.in', name: 'Manager User' },
      user: { email: 'employee@politikos.in', name: 'Employee User' },
    }

    const email = customEmail || devAccounts[role].email
    const name = customName || devAccounts[role].name

    try {
      const tokenRes = await axiosInstance.post('/api/auth/dev-token', { email, name })
      const token = tokenRes.data.data.token
      await loginWithBackend(token)
    } catch (err: any) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('deactivated')) {
        // Prevent the 401 interceptor redirect — we handle it here
        localStorage.removeItem('deactivated_message')
        setError(msg)
      } else {
        setError(msg || 'Dev login failed. Is the backend running on localhost:5000?')
      }
    } finally {
      setIsLoading(false)
    }
  }, [loginWithBackend])

  // Logout
  const logout = useCallback(() => {
    clearAuth()
    if (!IS_DEV_MODE) {
      instance.logoutPopup({
        postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI || '/',
      })
    }
  }, [instance, clearAuth])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isDevMode: IS_DEV_MODE,
      currentView,
      availableViews,
      canSwitchView,
      switchView,
      login,
      devLogin,
      logout,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
