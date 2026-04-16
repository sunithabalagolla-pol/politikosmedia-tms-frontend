import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

// Types
export interface Phase {
  id: string
  category_id: string
  name: string
  description: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface PhaseWithDetails extends Phase {
  category_name: string
  task_count: number
}

export interface CreatePhaseInput {
  name: string
  description?: string
  order_index?: number
}

export interface UpdatePhaseInput {
  name?: string
  description?: string
  order_index?: number
}

export interface TaskFilters {
  status?: string
  priority?: string
  assignee?: string
  search?: string
  page?: number
  limit?: number
}

// Hooks

// Get all phases (from all categories) - for employee phase filter
export function useAllPhases() {
  return useQuery({
    queryKey: ['phases', 'all'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/phases')
      return data.data as Phase[]
    },
    staleTime: 30000, // 30s
  })
}

// Get only phases where employee has assigned tasks
export function useAssignedPhases(categoryId?: string) {
  return useQuery({
    queryKey: ['phases', 'assigned', categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ assigned: 'true' })
      if (categoryId) params.append('category_id', categoryId)
      const { data } = await axiosInstance.get(`/api/v1/phases?${params}`)
      return data.data as Phase[]
    },
    staleTime: 30000, // 30s
  })
}

// Get all phases for a category
export function usePhases(categoryId: string | null) {
  return useQuery({
    queryKey: ['phases', categoryId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/categories/${categoryId}/phases`)
      return data.data as Phase[]
    },
    enabled: !!categoryId,
    staleTime: 30000, // 30s
  })
}

// Get single phase with task count
export function usePhase(id: string | null) {
  return useQuery({
    queryKey: ['phases', 'detail', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/phases/${id}`)
      return data.data as PhaseWithDetails
    },
    enabled: !!id,
    staleTime: 30000, // 30s
  })
}

// Create phase under a category
export function useCreatePhase(categoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePhaseInput) => {
      const { data } = await axiosInstance.post(`/api/v1/categories/${categoryId}/phases`, input)
      return data.data as Phase
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phases', categoryId] })
      qc.invalidateQueries({ queryKey: ['categories', categoryId] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Update phase
export function useUpdatePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: UpdatePhaseInput }) => {
      const { data } = await axiosInstance.put(`/api/v1/phases/${id}`, input)
      return data.data as Phase
    },
    onSuccess: (updatedPhase) => {
      qc.invalidateQueries({ queryKey: ['phases'] })
      qc.invalidateQueries({ queryKey: ['phases', 'detail', updatedPhase.id] })
      qc.invalidateQueries({ queryKey: ['categories', updatedPhase.category_id] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Delete phase (only if no tasks)
export function useDeletePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(`/api/v1/phases/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phases'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Get all tasks for a phase with filtering
export function usePhaseTasks(phaseId: string | null, filters?: TaskFilters) {
  return useQuery({
    queryKey: ['phases', phaseId, 'tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.assignee) params.append('assignee', filters.assignee)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      
      const queryString = params.toString()
      const url = `/api/v1/phases/${phaseId}/tasks${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data
    },
    enabled: !!phaseId,
    staleTime: 30000, // 30s
  })
}
