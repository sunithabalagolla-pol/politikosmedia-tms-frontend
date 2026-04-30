import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Key, Loader2, AlertCircle, Info, Users, Clock } from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'
import { usePublicSettings } from '../hooks/api/useSettings'
import axiosInstance from '../api/axiosInstance'

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated, setUserFromResponse } = useAuth()

  // Public settings — drives what UI to show
  const { data: publicSettings, isLoading: settingsLoading } = usePublicSettings()
  const azureVerified = publicSettings?.azure_verified === true
  // admin_email may not be in public settings yet — fall back to the known default
  const adminEmail = publicSettings?.admin_email || 'admin@politikos.in'

  // Page-level messages
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [ssoError, setSsoError] = useState<string | null>(null)
  const [deactivatedMessage, setDeactivatedMessage] = useState<string | null>(null)

  // Admin card state
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)

  // Read messages left in localStorage by other flows (session expiry, deactivation)
  useEffect(() => {
    const msg = localStorage.getItem('auth_message')
    if (msg) { setAuthMessage(msg); localStorage.removeItem('auth_message') }

    const deact = localStorage.getItem('deactivated_message')
    if (deact) { setDeactivatedMessage(deact); localStorage.removeItem('deactivated_message') }
  }, [])

  // Handle ?error= param from SSO callback redirect
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setSsoError(
        errorParam === 'sso_failed'
          ? 'Sign in failed. Please try again or contact your administrator.'
          : `Sign in failed: ${decodeURIComponent(errorParam)}`
      )
      searchParams.delete('error')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirects: Record<UserRole, string> = {
        admin: '/dashboard/overview',
        manager: '/manager/overview',
        user: '/user/overview',
      }
      navigate(redirects[user.role], { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // SSO — full page redirect to backend OIDC flow
  const handleSsoLogin = () => {
    setSsoError(null)
    window.location.href = '/api/auth/oidc/redirect'
  }

  // Admin one-click login
  const handleAdminLogin = async () => {
    if (adminLoading) return
    setAdminLoading(true)
    setAdminError(null)

    try {
      const res = await axiosInstance.post('/api/auth/admin-login', { email: adminEmail })
      const userData = res.data.data?.user || res.data.user

      // Hydrate AuthContext — no second /api/auth/me call needed
      setUserFromResponse(userData, 'admin')

      const role = userData.role === 'employee' ? 'user' : userData.role
      const redirects: Record<string, string> = {
        admin: '/dashboard/overview',
        manager: '/manager/overview',
        user: '/user/overview',
      }
      window.location.href = redirects[role] || '/dashboard/overview'
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message
      if (status === 429) {
        setAdminError(msg || 'Too many admin login attempts. Try again in 15 minutes.')
      } else if (status === 401) {
        setAdminError(msg || 'Not authorized for admin access.')
      } else if (status === 400) {
        setAdminError(msg || 'Email is required.')
      } else {
        setAdminError('Something went wrong. Please try again.')
      }
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">

        {/* ── Branding ── */}
        <section className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#b23a48] via-[#a33542] to-[#c75563] relative overflow-hidden min-h-[600px]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col items-center px-10">
            <div className="w-56 h-56 mb-6 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm p-5 ring-2 ring-white/30 shadow-lg">
              <img
                alt="Politikos Logo"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase mb-2">Politikos</h1>
            <p className="text-sm text-red-100/90 max-w-[260px] text-center leading-relaxed">
              Secure access to your political engagement platform
            </p>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-tight">10K+</div>
                  <div className="text-[11px] text-red-200">Active Users</div>
                </div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-tight">99.9%</div>
                  <div className="text-[11px] text-red-200">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Login Panel ── */}
        <section className="flex flex-col items-center justify-center px-8 py-8 overflow-y-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-5">
            <img
              alt="Politikos Logo"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
              className="w-20 h-20 object-contain"
            />
            <h2 className="text-lg font-bold text-dark dark:text-white uppercase tracking-wide">Politikos</h2>
          </div>

          <div className="w-full max-w-sm space-y-4">

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue</p>
            </div>

            {/* Session / auth messages */}
            {authMessage && (
              <div className="flex items-center gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">{authMessage}</p>
              </div>
            )}
            {ssoError && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{ssoError}</p>
              </div>
            )}
            {deactivatedMessage && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">{deactivatedMessage}</p>
              </div>
            )}

            {/* Loading skeleton while settings fetch */}
            {settingsLoading ? (
              <div className="space-y-3">
                <div className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
              </div>
            ) : (
              <>
                {/* Sign in with Microsoft — only when azure_verified */}
                {azureVerified && (
                  <button
                    type="button"
                    onClick={handleSsoLogin}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-md"
                  >
                    <MicrosoftIcon />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
                        Sign in with Microsoft
                      </span>
                      <span className="text-[11px] text-gray-400 leading-tight">
                        For employees and managers
                      </span>
                    </div>
                  </button>
                )}

                {/* Divider — shown when both options are visible */}
                {azureVerified && (
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      or
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                )}

                {/* Admin card — always visible */}
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={adminLoading}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-all shadow-sm text-left
                    ${adminLoading
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md active:scale-[0.99] cursor-pointer'
                    }`}
                >
                  {adminLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#b23a48] shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#b23a48]/10 dark:bg-[#b23a48]/20 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-[#b23a48]" />
                    </div>
                  )}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">Admin</span>
                    <span className="text-[11px] text-gray-400 leading-tight truncate max-w-[200px]">
                      {adminEmail}
                    </span>
                  </div>
                </button>

                {/* Admin error */}
                {adminError && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400">{adminError}</p>
                  </div>
                )}
              </>
            )}

            {/* Terms */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
              By signing in, you agree to our{' '}
              <a href="#" className="text-[#b23a48] hover:underline font-medium">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-[#b23a48] hover:underline font-medium">Privacy Policy</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
