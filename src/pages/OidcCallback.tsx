import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

/**
 * Handles the backend SSO callback redirect.
 * Backend redirects here as:
 *   /auth/callback?success=true        — login succeeded, cookie already set
 *   /auth/callback?error=<message>     — login failed
 */
export default function OidcCallback() {
  const navigate = useNavigate()
  const { setUserFromResponse } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const success = params.get('success')
      const error = params.get('error')

      if (error) {
        // Redirect to login with the error message as a query param
        navigate(`/?error=${encodeURIComponent(error)}`, { replace: true })
        return
      }

      if (success === 'true') {
        try {
          // Cookie is already set by the backend — just fetch the user
          const res = await axiosInstance.get('/api/auth/me')

          if (res.data.success && res.data.data?.user) {
            const userData = res.data.data.user
            const role: UserRole = userData.role === 'employee' ? 'user' : userData.role

            // Hydrate AuthContext
            setUserFromResponse(userData, 'sso')

            const redirects: Record<UserRole, string> = {
              admin: '/dashboard/overview',
              manager: '/manager/overview',
              user: '/user/overview',
            }
            navigate(redirects[role] || '/dashboard/overview', { replace: true })
          } else {
            navigate('/?error=sso_failed', { replace: true })
          }
        } catch (err) {
          console.error('SSO callback error:', err)
          navigate('/?error=sso_failed', { replace: true })
        }
      } else {
        // No recognised params — treat as failure
        navigate('/?error=sso_failed', { replace: true })
      }
    }

    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#b23a48] animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Completing sign in...</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please wait while we verify your account.</p>
      </div>
    </div>
  )
}
