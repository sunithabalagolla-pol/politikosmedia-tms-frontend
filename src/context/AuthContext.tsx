import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import axiosInstance from '../api/axiosInstance'

// Backend returns "employee", frontend routes use "user" — map between them
export type UserRole = 'admin' | 'manager' | 'user'
export type ViewMode = 'manager' | 'employee'

function mapRole(role: string): UserRole {
  if (role === 'employee') return 'user'
  return role as UserRole
}

interface User {
  id?: string
  name: string
  email: string
  role: UserRole
  available_views?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  currentView: ViewMode
  availableViews: string[]
  canSwitchView: boolean
  switchView: (view: ViewMode) => void
  logout: () => Promise<void>
  setUserFromResponse: (userData: User, loginMethod: 'admin' | 'sso') => void
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentView: 'manager',
  availableViews: [],
  canSwitchView: false,
  switchView: () => {},
  logout: async () => {},
  setUserFromResponse: () => {},
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Clear all auth state
  const clearAuth = useCallback(() => {
    setUser(null)
    setCurrentView('manager')
    setAvailableViews([])
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    localStorage.removeItem('currentView')
    localStorage.removeItem('availableViews')
    localStorage.removeItem('login_method')
  }, [])

  // Called after a successful login (admin card or SSO callback)
  // to hydrate the context without a second /api/auth/me call
  const setUserFromResponse = useCallback((userData: User, loginMethod: 'admin' | 'sso') => {
    const role = mapRole(userData.role as string)
    const normalised: User = { ...userData, role }

    const views = userData.available_views || (role === 'user' ? ['employee'] : ['manager', 'employee'])
    setAvailableViews(views)
    localStorage.setItem('availableViews', JSON.stringify(views))

    const storedView = localStorage.getItem('currentView')
    if (!storedView) {
      const initialView: ViewMode = role === 'user' ? 'employee' : 'manager'
      setCurrentView(initialView)
      localStorage.setItem('currentView', initialView)
    }

    setUser(normalised)
    localStorage.setItem('user', JSON.stringify(normalised))
    localStorage.setItem('userRole', role)
    localStorage.setItem('login_method', loginMethod)
  }, [])

  // On mount: verify session via GET /api/auth/me (cookie-based)
  useEffect(() => {
    const initAuth = async () => {
      // Fast path: restore from localStorage cache
      const cached = localStorage.getItem('user')
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as User
          setUser(parsed)
          setIsLoading(false)
          return
        } catch {
          clearAuth()
        }
      }

      // No cache — check if there's an active cookie session
      try {
        const res = await axiosInstance.get('/api/auth/me')
        if (res.data.success && res.data.data?.user) {
          const userData = res.data.data.user
          const loginMethod = (localStorage.getItem('login_method') as 'admin' | 'sso') || 'sso'
          setUserFromResponse(userData, loginMethod)
        }
      } catch {
        // No active session — stay on login page
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Logout — POST /api/auth/logout clears the httpOnly cookie
  // For SSO users the backend may issue a 302 to Azure AD logout,
  // so we do a full page redirect instead of an axios call.
  const logout = useCallback(async () => {
    const loginMethod = localStorage.getItem('login_method')
    clearAuth()

    if (loginMethod === 'sso') {
      // Let the backend handle the Azure AD logout redirect chain
      window.location.href = '/api/auth/logout'
    } else {
      try {
        await axiosInstance.post('/api/auth/logout')
      } catch {
        // ignore — cookie may already be gone
      }
      window.location.href = '/'
    }
  }, [clearAuth])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      currentView,
      availableViews,
      canSwitchView,
      switchView,
      logout,
      setUserFromResponse,
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
