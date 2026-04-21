import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Fetch public settings (no auth required)
export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/settings/public')
      return data.data || data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.SETTINGS)
      return data.data || data
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings: { language?: string; email_notifications?: boolean; push_notifications?: boolean }) => {
      const { data } = await axiosInstance.put(API.SETTINGS, settings)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Update show_departments_menu_manager setting (admin only)
export function useUpdateDepartmentsMenuManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_departments_menu_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_departments_menu_employee setting (admin only)
export function useUpdateDepartmentsMenuEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_departments_menu_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_reports_download_manager setting (admin only)
export function useUpdateReportsDownloadManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_reports_download_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_reports_download_employee setting (admin only)
export function useUpdateReportsDownloadEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_reports_download_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_reports_view_manager setting (admin only)
export function useUpdateReportsViewManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_reports_view_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_reports_view_employee setting (admin only)
export function useUpdateReportsViewEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_reports_view_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_create_manager setting (admin only)
export function useUpdateTicketsCreateManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_create_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_create_employee setting (admin only)
export function useUpdateTicketsCreateEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_create_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_update_manager setting (admin only)
export function useUpdateTicketsUpdateManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_update_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_update_employee setting (admin only)
export function useUpdateTicketsUpdateEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_update_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_view_manager setting (admin only)
export function useUpdateTicketsViewManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_view_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_view_employee setting (admin only)
export function useUpdateTicketsViewEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_view_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_delete_manager setting (admin only)
export function useUpdateTicketsDeleteManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_delete_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_tickets_delete_employee setting (admin only)
export function useUpdateTicketsDeleteEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_tickets_delete_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_add_manager setting (admin only)
export function useUpdateTeamAddManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_add_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_add_employee setting (admin only)
export function useUpdateTeamAddEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_add_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_edit_manager setting (admin only)
export function useUpdateTeamEditManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_edit_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_edit_employee setting (admin only)
export function useUpdateTeamEditEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_edit_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_deactivate_manager setting (admin only)
export function useUpdateTeamDeactivateManagerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_deactivate_manager', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}

// Update show_team_deactivate_employee setting (admin only)
export function useUpdateTeamDeactivateEmployeeSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (value: boolean) => {
      const { data } = await axiosInstance.put('/api/settings/show_team_deactivate_employee', {
        value: value.toString()
      })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'public'] })
    },
  })
}
