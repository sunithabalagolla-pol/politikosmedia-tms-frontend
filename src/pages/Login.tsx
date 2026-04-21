import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Loader2, AlertCircle, Check, ArrowRight } from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, isDevMode, login, devLogin, error } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')
  const [devLoading, setDevLoading] = useState(false)
  const [devSuccess, setDevSuccess] = useState(false)
  const [useCustomEmail, setUseCustomEmail] = useState(false)
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [deactivatedMessage, setDeactivatedMessage] = useState<string | null>(null)

  // Check for deactivation message on mount
  useEffect(() => {
    const msg = localStorage.getItem('deactivated_message')
    if (msg) {
      setDeactivatedMessage(msg)
      localStorage.removeItem('deactivated_message')
    }
  }, [])

  // If already logged in, redirect to correct dashboard
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

  const handleSSO = async () => {
    await login()
  }

  const handleDevLogin = async () => {
    setDevLoading(true)
    setDevSuccess(false)
    if (useCustomEmail && customEmail) {
      await devLogin(selectedRole, customEmail, customName || customEmail.split('@')[0])
    } else {
      await devLogin(selectedRole)
    }
    setDevLoading(false)
    setDevSuccess(true)
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 h-screen flex items-center justify-center p-2 overflow-hidden">
      <div className="w-full max-w-4xl h-[580px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Branding Section */}
        <section className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#b23a48] via-[#b23a48] to-[#c75563] p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-center">
            <img
              alt="Politikos Logo"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
              className="w-32 h-32 object-contain mb-4 mx-auto drop-shadow-2xl"
            />
            <h1 className="text-3xl font-bold text-white mb-3 uppercase tracking-tight">Politikos</h1>
            <p className="text-sm text-red-100 max-w-xs mx-auto leading-relaxed">
              Secure access to your political engagement platform
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">10K+</div>
                <div className="text-xs text-red-200 mt-0.5">Active Users</div>
              </div>
              <div className="w-px h-10 bg-red-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">99.9%</div>
                <div className="text-xs text-red-200 mt-0.5">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section className="flex flex-col items-center justify-center p-5 overflow-y-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-4">
            <img
              alt="Politikos Logo"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
              className="w-16 h-16 object-contain"
            />
            <h2 className="text-lg font-bold text-dark dark:text-white uppercase">Politikos</h2>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-4 text-center lg:text-left">
              <h2 className="text-xl lg:text-lg font-bold text-dark dark:text-white mb-1">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {isDevMode ? 'Development mode — select a role to continue' : 'Sign in with your @politikos.in account'}
              </p>
            </div>

            {/* Deactivation Message */}
            {deactivatedMessage && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">{deactivatedMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Dev Mode Banner */}
            {isDevMode && (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Dev Mode — Azure SSO not configured. Using local role selector.
                </p>
              </div>
            )}

            {isDevMode ? (
              <>
                {/* Dev Mode: Role Selector + Login */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-dark dark:text-gray-200">Login As</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'user' as UserRole, label: 'Employee', email: 'employee@politikos.in' },
                        { value: 'manager' as UserRole, label: 'Manager', email: 'manager@politikos.in' },
                        { value: 'admin' as UserRole, label: 'Admin', email: 'admin@politikos.in' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedRole(opt.value)}
                          className={`w-full px-2 py-2.5 rounded-md border-2 transition-all font-medium text-xs flex flex-col items-center gap-0.5 overflow-hidden ${
                            selectedRole === opt.value
                              ? 'border-[#b23a48] bg-[#b23a48]/5 text-[#b23a48]'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-semibold">{opt.label}</span>
                          <span className={`w-full text-center truncate text-[10px] font-normal ${selectedRole === opt.value ? 'text-[#b23a48]/70' : 'text-gray-400 dark:text-gray-500'}`}>{opt.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Email Toggle */}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="customEmail" checked={useCustomEmail} onChange={(e) => setUseCustomEmail(e.target.checked)}
                      className="w-3 h-3 rounded border-gray-300 text-[#b23a48] focus:ring-[#b23a48] cursor-pointer" />
                    <label htmlFor="customEmail" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">Login as a specific user (custom email)</label>
                  </div>

                  {useCustomEmail && (
                    <div className="space-y-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
                        <input type="email" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="test@politikos.in"
                          className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/30 focus:border-[#b23a48] placeholder-gray-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Name (optional)</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Test Employee"
                          className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/30 focus:border-[#b23a48] placeholder-gray-400" />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDevLogin}
                    disabled={devLoading}
                    className={`w-full ${
                      devSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'
                    } text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 shadow-lg shadow-[#b23a48]/30 relative overflow-hidden flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed text-xs`}
                  >
                    {devLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : devSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Success!
                      </>
                    ) : (
                      <>
                        Sign In (Dev)
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Production: SSO Only */}
                <button
                  type="button"
                  onClick={handleSSO}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#b23a48] rounded-lg hover:bg-[#8f2e3a] transition-all text-xs font-bold text-white shadow-lg shadow-[#b23a48]/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Sign in with Microsoft SSO
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                    Use your <span className="font-semibold text-gray-700 dark:text-gray-300">@politikos.in</span> Microsoft account to sign in.
                    Your role and permissions are assigned by your administrator.
                  </p>
                </div>
              </>
            )}

            {/* Terms */}
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 leading-tight">
              By signing in, you agree to our{' '}
              <a href="#" className="text-[#b23a48] hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-[#b23a48] hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
