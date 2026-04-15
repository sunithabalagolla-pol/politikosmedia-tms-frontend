import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRole: UserRole
  children: React.ReactNode
}

export default function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, currentView } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#b23a48] animate-spin" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  // Manager/admin in employee view can access /user routes
  const isManagerInEmployeeView =
    (user.role === 'manager' || user.role === 'admin') &&
    currentView === 'employee' &&
    allowedRole === 'user'

  if (user.role !== allowedRole && !isManagerInEmployeeView) {
    const roleRedirects: Record<UserRole, string> = {
      admin: '/dashboard/overview',
      manager: '/manager/overview',
      user: '/user/overview',
    }
    return <Navigate to={roleRedirects[user.role]} replace />
  }

  return <>{children}</>
}
