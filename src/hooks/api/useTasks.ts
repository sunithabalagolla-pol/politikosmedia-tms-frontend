import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

interface TaskFilters {
  status?: string
  priority?: string
  dueDate?: string
  assignee?: string
  search?: string
  page?: number
  limit?: number
}

// Get all tasks (admin/manager)
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.TASKS, { params: filters })
      return data.data || data
    },
    staleTime: 30000, // 30s — refetches on window focus if data is older than 30s
  })
}

// Get single task detail — polls every 15s when active (for other users' updates)
export function useTask(id: string | number | null) {
  const taskId = id !== null ? String(id) : null
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.TASK_BY_ID(id!))
      return data.data || data
    },
    enabled: !!id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })
}

// Create task(s)
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tasks: any[]) => {
      const { data } = await axiosInstance.post(API.TASKS, { tasks })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['phases'] }) // Invalidate all phase-related queries
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['categories'] }) // Invalidate categories to update task counts
    },
  })
}

// Update task
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string | number; [key: string]: any }) => {
      const { data } = await axiosInstance.put(API.TASK_BY_ID(id), body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] })
      qc.invalidateQueries({ queryKey: ['phases'] }) // Invalidate phase tasks
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
      qc.invalidateQueries({ queryKey: ['categories'] }) // Update task counts
    },
  })
}

// Quick status update — updates cache directly, no refetch needed
export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, hold_note }: { id: string | number; status: string; hold_note?: string }) => {
      const body: any = { status }
      if (hold_note) body.hold_note = hold_note
      const { data } = await axiosInstance.patch(API.TASK_STATUS(id), body)
      return data.data || data
    },
    onSuccess: (updatedTask, { id }) => {
      const taskId = String(id)
      qc.setQueryData(['tasks', taskId], (old: any) => {
        return old ? { ...old, ...updatedTask } : updatedTask
      })
      qc.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!old || !Array.isArray(old?.tasks || old)) return old
        const list = old.tasks || old
        const updated = list.map((t: any) => String(t.id) === taskId ? { ...t, ...updatedTask } : t)
        return old.tasks ? { ...old, tasks: updated } : updated
      })
      qc.invalidateQueries({ queryKey: ['phases'] })
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Quick priority update — updates cache directly
export function useUpdateTaskPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, priority }: { id: string | number; priority: string }) => {
      const { data } = await axiosInstance.patch(API.TASK_PRIORITY(id), { priority })
      return data.data || data
    },
    onSuccess: (updatedTask, { id }) => {
      const taskId = String(id)
      qc.setQueryData(['tasks', taskId], (old: any) => old ? { ...old, ...updatedTask } : updatedTask)
      qc.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!old || !Array.isArray(old?.tasks || old)) return old
        const list = old.tasks || old
        const updated = list.map((t: any) => String(t.id) === taskId ? { ...t, ...updatedTask } : t)
        return old.tasks ? { ...old, tasks: updated } : updated
      })
      qc.invalidateQueries({ queryKey: ['phases'] }) // Invalidate phase tasks
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

// Delete task
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await axiosInstance.delete(API.TASK_BY_ID(id))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['phases'] }) // Invalidate phase tasks
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['categories'] }) // Update task counts
    },
  })
}

// Add comment to task — appends to cache directly
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data } = await axiosInstance.post(`/api/v1/tasks/${taskId}/comments`, { content })
      return data.data || data
    },
    onSuccess: (newComment, { taskId }) => {
      const id = String(taskId)
      qc.setQueryData(['tasks', id], (old: any) => {
        if (!old) return old
        return { ...old, comments: [...(old.comments || []), newComment] }
      })
    },
  })
}

// My Tasks (personal)
export function useMyTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['my-tasks', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.MY_TASKS, { params: filters })
      return data.data || data
    },
    staleTime: 30000,
  })
}

// My Tasks stats
export function useMyTasksStats() {
  return useQuery({
    queryKey: ['my-tasks', 'stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.MY_TASKS_STATS)
      return data.data || data
    },
  })
}
