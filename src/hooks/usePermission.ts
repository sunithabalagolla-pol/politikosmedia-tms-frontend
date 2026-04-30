import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axiosInstance'

interface AuthMeResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  permissions: string[]
}

// Fetch user info and permissions from backend
export function useUserPermissions() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/auth/me')
      return data.data as AuthMeResponse
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions only change when admin updates them
    retry: 1, // Only retry once on failure
  })
}

// Check if user has a specific permission
export function usePermission(permissionKey: string): boolean {
  const { data } = useUserPermissions()
  
  if (!data?.permissions) {
    return false
  }
  
  const hasPermission = data.permissions.includes(permissionKey)
  
  return hasPermission
}

// Check if user has ANY of the provided permissions
export function useHasAnyPermission(permissionKeys: string[]): boolean {
  const { data } = useUserPermissions()
  
  if (!data?.permissions) {
    return false
  }
  
  return permissionKeys.some(key => data.permissions.includes(key))
}

// Check if user has ALL of the provided permissions
export function useHasAllPermissions(permissionKeys: string[]): boolean {
  const { data } = useUserPermissions()
  
  if (!data?.permissions) {
    return false
  }
  
  return permissionKeys.every(key => data.permissions.includes(key))
}
