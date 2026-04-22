import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

export default function OidcCallback() {
  const navigate = useNavigate()
  const { saveUser } = useAuth() as any

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The backend has already set the httpOnly cookie
        // Just fetch the user data
        const response = await axiosInstance.get('/api/auth/me')
        
        if (response.data.success && response.data.data?.user) {
          const data = response.data.data.user
          const role = data.role === 'employee' ? 'user' : data.role
          
          // Redirect to appropriate dashboard
          const redirects: Record<UserRole, string> = {
            admin: '/dashboard/overview',
            manager: '/manager/overview',
            user: '/user/overview',
          }
          
          navigate(redirects[role as UserRole] || '/dashboard/overview', { replace: true })
        } else {
          // No user data, redirect to login
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('OIDC callback error:', error)
        navigate('/', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#b23a48] animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}
