import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

export interface ReportFilters {
  category_id?: string
  phase_id?: string
}

export function useCompletionTrend(filter: string, department?: string, offset = 0, filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'completion-trend', filter, department, offset, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('filter', filter)
      params.append('offset', offset.toString())
      if (department && department !== 'all') params.append('department', department)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const { data } = await axiosInstance.get(`${API.REPORTS_COMPLETION_TREND}?${params}`)
      return data.data || data
    },
  })
}

export function useDepartmentThroughput(filter: string, offset = 0, enabled = true, filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'department-throughput', filter, offset, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('filter', filter)
      params.append('offset', offset.toString())
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const { data } = await axiosInstance.get(`${API.REPORTS_DEPARTMENT_THROUGHPUT}?${params}`)
      return data.data || data
    },
    enabled,
  })
}

export function useTasksByPriority(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'tasks-by-priority', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.REPORTS_TASKS_BY_PRIORITY}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

export function useTasksDueSoon(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'tasks-due-soon', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.REPORTS_TASKS_DUE_SOON}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

export function useReportStats(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.REPORTS_STATS}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// ─── Channel Report Hooks ───

export function useChannelReportStats(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['reports', 'channel-stats', channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const qs = params.toString()
      const { data } = await axiosInstance.get(`/api/v1/reports/channel-stats${qs ? `?${qs}` : ''}`)
      return data.data || data
    },
  })
}

export function useChannelByChannel() {
  return useQuery({
    queryKey: ['reports', 'channel-by-channel'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/reports/channel-by-channel')
      return data.data || data
    },
    staleTime: 30000,
  })
}

export function useChannelBySubcategory(channelId?: string) {
  return useQuery({
    queryKey: ['reports', 'channel-by-subcategory', channelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/reports/channel-by-subcategory?channel_id=${channelId}`)
      return data.data || data
    },
    enabled: !!channelId,
    staleTime: 30000,
  })
}

export function useChannelByEmployee(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['reports', 'channel-by-employee', channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const qs = params.toString()
      const { data } = await axiosInstance.get(`/api/v1/reports/channel-by-employee${qs ? `?${qs}` : ''}`)
      return data.data || data
    },
  })
}

export function useChannelCompletionTrend(filter: string, offset: number, channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['reports', 'channel-completion-trend', filter, offset, channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ filter, offset: String(offset) })
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const { data } = await axiosInstance.get(`/api/v1/reports/channel-completion-trend?${params}`)
      return data.data || data
    },
  })
}

// ─── Show Report Hooks ───

export function useShowReportStats() {
  return useQuery({
    queryKey: ['reports', 'show-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/reports/show-stats')
      return data.data || data
    },
  })
}

export function useShowByShow() {
  return useQuery({
    queryKey: ['reports', 'show-by-show'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/reports/show-by-show')
      return data.data || data
    },
    staleTime: 30000,
  })
}
