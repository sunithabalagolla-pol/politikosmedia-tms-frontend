import { useAuth, type UserRole } from '../context/AuthContext'

export function useRole() {
  const { user } = useAuth()

  const role: UserRole | null = user?.role || null

  const isAdmin = () => role === 'admin'
  const isManager = () => role === 'manager'
  const isEmployee = () => role === 'user'

  // Admin OR Manager — for shared features like org-wide tasks, reports
  const isAdminOrManager = () => role === 'admin' || role === 'manager'

  return { role, isAdmin, isManager, isEmployee, isAdminOrManager }
}
