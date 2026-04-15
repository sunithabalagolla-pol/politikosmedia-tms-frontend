import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

interface Permission {
  id: number
  permission_key: string
  permission_name: string
  group_name: string
  admin: boolean
  manager: boolean
  employee: boolean
}

interface PermissionUpdate {
  permission_key: string
  manager: boolean
  employee: boolean
}

// GET /api/v1/permissions - Fetch all permissions (Admin only)
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      console.log('🔄 Fetching permissions from API...')
      const { data } = await axiosInstance.get('/api/v1/permissions')
      console.log('📦 Raw API response:', data)
      
      const result = data.data || data
      console.log('📦 Extracted result:', result)
      console.log('📦 Result type:', typeof result, 'Is array?', Array.isArray(result))
      
      // Backend returns grouped object: { "Task Management": [...], "Team Management": [...] }
      // Convert to flat array while preserving group_name
      if (typeof result === 'object' && !Array.isArray(result)) {
        const flattened = Object.entries(result).flatMap(([groupName, perms]: [string, any]) =>
          perms.map((perm: any) => ({
            ...perm,
            group_name: groupName
          }))
        ) as Permission[]
        console.log('✅ Converted to flat array with group_name:', flattened)
        return flattened
      }
      
      console.log('✅ Returning as-is (already array):', result)
      return result as Permission[]
    },
    staleTime: 1000, // 1 second - refresh quickly to show permission changes
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  })
}

// PUT /api/v1/permissions - Update permissions (Admin only)
export function useUpdatePermissions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (permissions: PermissionUpdate[]) => {
      const { data } = await axiosInstance.put('/api/v1/permissions', { permissions })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }) // Invalidate user permissions cache
    },
  })
}
