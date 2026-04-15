import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

export interface DashboardFilters {
  category_id?: string
  phase_id?: string
}

// Admin/Manager: org-wide stats
export function useDashboardStats(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_STATS}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Employee: personal stats
export function usePersonalStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats', 'personal'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.DASHBOARD_STATS_PERSONAL)
      return data.data || data
    },
  })
}

// Tasks by status donut chart
export function useTasksByStatus(timeline: string, department: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'tasks-by-status', timeline, department, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (timeline) params.append('timeline', timeline)
      if (department) params.append('department', department)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_TASKS_BY_STATUS}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Created vs Completed sparkline
export function useCreatedVsCompleted(department: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'created-vs-completed', department, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (department) params.append('department', department)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_CREATED_VS_COMPLETED}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Activity timeline
export function useActivityTimeline(period: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'activity-timeline', period, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (period) params.append('period', period)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_ACTIVITY_TIMELINE}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Recent activity feed
export function useRecentActivity(limit = 5, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_RECENT_ACTIVITY}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Department progress
export function useDepartmentProgress(department: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'department-progress', department, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (department) params.append('department', department)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_DEPARTMENT_PROGRESS}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Upcoming deadlines (admin/manager)
export function useUpcomingDeadlines(limit = 4, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'upcoming-deadlines', limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      const queryString = params.toString()
      const url = `${API.DASHBOARD_UPCOMING_DEADLINES}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
  })
}

// Recent tasks (employee)
export function useRecentTasks(limit = 4) {
  return useQuery({
    queryKey: ['dashboard', 'recent-tasks', limit],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.DASHBOARD_RECENT_TASKS, {
        params: { limit },
      })
      return data.data || data
    },
  })
}

// Upcoming deadlines personal (employee)
export function usePersonalDeadlines(limit = 3) {
  return useQuery({
    queryKey: ['dashboard', 'upcoming-deadlines', 'personal', limit],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.DASHBOARD_UPCOMING_DEADLINES_PERSONAL, {
        params: { limit },
      })
      return data.data || data
    },
  })
}

// Tasks by category (all categories, no filters)
export function useTasksByCategory() {
  return useQuery({
    queryKey: ['dashboard', 'tasks-by-category'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/dashboard/tasks-by-category')
      return data.data || data
    },
    staleTime: 30000,
  })
}

// Tasks by phase (for selected category)
export function useTasksByPhase(categoryId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'tasks-by-phase', categoryId],
    queryFn: async () => {
      if (!categoryId) return []
      const { data } = await axiosInstance.get(`/api/v1/dashboard/tasks-by-phase?category_id=${categoryId}`)
      return data.data || data
    },
    enabled: !!categoryId,
    staleTime: 30000,
  })
}

// ─── Channel Dashboard Hooks ───

// Channel Stats (stat cards)
export function useChannelStats(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'channel-stats', channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const qs = params.toString()
      const { data } = await axiosInstance.get(`/api/v1/dashboard/channel-stats${qs ? `?${qs}` : ''}`)
      return data.data || data
    },
  })
}

// Tasks by Channel (left chart - always visible)
export function useTasksByChannel() {
  return useQuery({
    queryKey: ['dashboard', 'tasks-by-channel'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/dashboard/tasks-by-channel')
      return data.data || data
    },
    staleTime: 30000,
  })
}

// Tasks by Subcategory (right chart - only when channel selected)
export function useTasksBySubcategory(channelId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'tasks-by-subcategory', channelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/dashboard/tasks-by-subcategory?channel_id=${channelId}`)
      return data.data || data
    },
    enabled: !!channelId,
    staleTime: 30000,
  })
}

// Progress by Employee
export function useChannelProgressByEmployee(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'channel-progress-by-employee', channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const qs = params.toString()
      const { data } = await axiosInstance.get(`/api/v1/dashboard/channel-progress-by-employee${qs ? `?${qs}` : ''}`)
      return data.data || data
    },
  })
}

// Channel Recent Activity
export function useChannelRecentActivity(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'channel-recent-activity', channelId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channel_id', channelId)
      if (subcategoryId) params.append('subcategory_id', subcategoryId)
      const qs = params.toString()
      const { data } = await axiosInstance.get(`/api/v1/dashboard/channel-recent-activity${qs ? `?${qs}` : ''}`)
      return data.data || data
    },
  })
}

// Employee: personal channel stats
export function usePersonalChannelStats() {
  return useQuery({
    queryKey: ['dashboard', 'personal-channel-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/dashboard/stats/personal-channels')
      return data.data || data
    },
  })
}

// Admin/Manager: show stats
export function useShowStats() {
  return useQuery({
    queryKey: ['dashboard', 'show-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/dashboard/show-stats')
      return data.data || data
    },
  })
}

// Employee: personal show stats
export function usePersonalShowStats() {
  return useQuery({
    queryKey: ['dashboard', 'personal-show-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/dashboard/stats/personal-shows')
      return data.data || data
    },
  })
}
