import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Loader2, AlertCircle, Check, ArrowRight, Shield, Users, Clock } from 'lucide-react'
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

  const roleOptions: { value: UserRole; label: string; email: string; icon: React.ReactNode }[] = [
    { value: 'user', label: 'Employee', email: 'employee@politikos.in', icon: <Users className="w-4 h-4" /> },
    { value: 'manager', label: 'Manager', email: 'manager@politikos.in', icon: <Shield className="w-4 h-4" /> },
    { value: 'admin', label: 'Admin', email: 'admin@politikos.in', icon: <Key className="w-4 h-4" /> },
  ]

  return (
    <div className="bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">

        {/* ── Branding Section ── */}
        <section className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#b23a48] via-[#a33542] to-[#c75563] relative overflow-hidden">
          {/* Decorative background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full"></div>
            <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-white/5 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center px-10">
            {/* Logo — larger and properly fitted */}
            <div className="w-56 h-56 mb-6 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm p-5 ring-2 ring-white/30 shadow-lg">
              <img
                alt="Politikos Logo"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase mb-2">
              Politikos
            </h1>
            <p className="text-sm text-red-100/90 max-w-[260px] text-center leading-relaxed">
              Secure access to your political engagement platform
            </p>

            {/* Stats row */}
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
              <div className="w-px h-10 bg-white/20"></div>
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

        {/* ── Login Section ── */}
        <section className="flex flex-col items-center justify-center px-8 py-6 overflow-y-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-5">
            <img
              alt="Politikos Logo"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/Tz9cPupLGdQZn3kBi3w1sWlGp1K2%2F947fe713-f4b6-4c0e-bf88-0bd8016b5013.png"
              className="w-20 h-20 object-contain"
            />
            <h2 className="text-lg font-bold text-dark dark:text-white uppercase tracking-wide">Politikos</h2>
          </div>

          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-5 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isDevMode ? 'Development mode — select a role to continue' : 'Sign in with your @politikos.in account'}
              </p>
            </div>

            {/* Deactivation Message */}
            {deactivatedMessage && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">{deactivatedMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Dev Mode Banner */}
            {isDevMode && (
              <div className="mb-4 flex items-center gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Dev Mode — Azure SSO not configured. Using local role selector.
                </p>
              </div>
            )}

            {isDevMode ? (
              <div className="space-y-4">
                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Login As
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {roleOptions.map((opt) => {
                      const isSelected = selectedRole === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedRole(opt.value)}
                          className={`relative rounded-xl border-2 px-2 py-3 transition-all duration-200 flex flex-col items-center gap-1.5 text-center ${
                            isSelected
                              ? 'border-[#b23a48] bg-[#b23a48]/5 shadow-sm'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#b23a48] rounded-full flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-300'
                          }`}>
                            {opt.icon}
                          </div>
                          <span className={`text-xs font-semibold leading-tight ${
                            isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {opt.label}
                          </span>
                          <span className={`text-[10px] leading-tight truncate w-full ${
                            isSelected ? 'text-[#b23a48]/60' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {opt.email}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Email Toggle */}
                <label htmlFor="customEmail" className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="customEmail"
                    checked={useCustomEmail}
                    onChange={(e) => setUseCustomEmail(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#b23a48] focus:ring-[#b23a48] cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    Login as a specific user (custom email)
                  </span>
                </label>

                {/* Custom Email Fields */}
                {useCustomEmail && (
                  <div className="space-y-2.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="test@politikos.in"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] placeholder-gray-400 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Name (optional)</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Test Employee"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] placeholder-gray-400 transition-shadow"
                      />
                    </div>
                  </div>
                )}

                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={devLoading}
                  className={`w-full ${
                    devSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'
                  } text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#b23a48]/25 hover:shadow-xl hover:shadow-[#b23a48]/30 relative overflow-hidden flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed text-sm`}
                >
                  {devLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : devSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Success!
                    </>
                  ) : (
                    <>
                      Sign In (Dev)
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* Production: SSO Only */}
                <button
                  type="button"
                  onClick={handleSSO}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-[#b23a48] rounded-xl hover:bg-[#8f2e3a] transition-all text-sm font-semibold text-white shadow-lg shadow-[#b23a48]/25 hover:shadow-xl hover:shadow-[#b23a48]/30 disabled:opacity-70 disabled:cursor-not-allowed"
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

                <div className="mt-4 p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                    Use your <span className="font-semibold text-gray-700 dark:text-gray-300">@politikos.in</span> Microsoft account to sign in.
                    Your role and permissions are assigned by your administrator.
                  </p>
                </div>
              </>
            )}

            {/* Terms */}
            <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              By signing in, you agree to our{' '}
              <a href="#" className="text-[#b23a48] hover:underline font-medium">Terms of Service</a> and{' '}
              <a href="#" className="text-[#b23a48] hover:underline font-medium">Privacy Policy</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
