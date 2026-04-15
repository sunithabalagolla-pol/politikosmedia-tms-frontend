import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Get notifications
export function useNotifications(filter: 'all' | 'unread' = 'all') {
  return useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.NOTIFICATIONS, {
        params: { filter },
      })
      return data.data || data
    },
    refetchInterval: 30000, // Poll every 30s for new notifications
  })
}

// Mark single notification as read
export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await axiosInstance.patch(API.NOTIFICATION_READ(id))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Mark all as read
export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.patch(API.NOTIFICATIONS_READ_ALL)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
