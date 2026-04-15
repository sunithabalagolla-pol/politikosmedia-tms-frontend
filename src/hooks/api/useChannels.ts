import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

// Types
export interface Channel {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  sort_order: number
  subcategory_count?: number
  created_at: string
  updated_at: string
}

export interface ChannelSubcategory {
  id: string
  channel_id: string
  name: string
  description: string | null
  sort_order: number
  task_count?: number
  created_at: string
  updated_at: string
}

export type ChannelTaskStatus = 'not_started' | 'in_progress' | 'completed'

export interface ChannelTask {
  id: string
  channel_id: string
  channel_subcategory_id: string
  name: string
  description: string | null
  target_count: number
  type: string
  status: ChannelTaskStatus
  channel_name?: string
  subcategory_name?: string
  created_by: string
  created_by_name?: string
  assignees: ChannelTaskAssignee[]
  comments?: ChannelTaskComment[]
  total_completed: number
  progress_percentage: number
  my_completed_count: number
  my_status: ChannelTaskStatus
  my_last_updated: string
  created_at: string
  updated_at: string
}

export interface ChannelTaskAssignee {
  id: string
  name: string
  email: string
  avatar_url: string | null
  completed_count: number
  status: ChannelTaskStatus
  last_updated: string
}

export interface ChannelTaskComment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  content: string
  extracted_number: number | null
  created_at: string
}

export interface CreateChannelInput {
  name: string
  description?: string
  sort_order?: number
}

export interface UpdateChannelInput {
  name?: string
  description?: string
  sort_order?: number
}

export interface CreateSubcategoryInput {
  name: string
  description?: string
  sort_order?: number
}

export interface UpdateSubcategoryInput {
  name?: string
  description?: string
  sort_order?: number
}

export interface CreateChannelTaskInput {
  channel_id: string
  channel_subcategory_id: string
  name: string
  description?: string
  target_count: number
  type: string
  assigned_to: string[]
}

export interface UpdateProgressInput {
  completed_count: number
  comment?: string
}

// Channels
export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/channels')
      return data.data as Channel[]
    },
  })
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['channels', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/channels/${id}`)
      return data.data as Channel
    },
    enabled: !!id,
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const { data } = await axiosInstance.post('/api/v1/channels', input)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateChannelInput }) => {
      const { data } = await axiosInstance.put(`/api/v1/channels/${id}`, input)
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      queryClient.invalidateQueries({ queryKey: ['channels', variables.id] })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/v1/channels/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUploadChannelLogo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('logo', file)
      const { data } = await axiosInstance.post(`/api/v1/channels/${id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      queryClient.invalidateQueries({ queryKey: ['channels', variables.id] })
    },
  })
}

// Subcategories
export function useSubcategories(channelId: string) {
  return useQuery({
    queryKey: ['channels', channelId, 'subcategories'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/channels/${channelId}/subcategories`)
      return data.data as ChannelSubcategory[]
    },
    enabled: !!channelId,
  })
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ channelId, input }: { channelId: string; input: CreateSubcategoryInput }) => {
      const { data } = await axiosInstance.post(`/api/v1/channels/${channelId}/subcategories`, input)
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.channelId, 'subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateSubcategoryInput }) => {
      const { data } = await axiosInstance.put(`/api/v1/channels/subcategories/${id}`, input)
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channels', data.channel_id, 'subcategories'] })
    },
  })
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, channelId }: { id: string; channelId: string }) => {
      await axiosInstance.delete(`/api/v1/channels/subcategories/${id}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.channelId, 'subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

// Tasks
export function useChannelTasks(channelId?: string, subcategoryId?: string) {
  return useQuery({
    queryKey: ['channel-tasks', channelId, subcategoryId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/api/v1/channels/${channelId}/subcategories/${subcategoryId}/tasks`
      )
      return data.data as ChannelTask[]
    },
    enabled: !!channelId && !!subcategoryId,
  })
}

export function useChannelTask(id: string) {
  return useQuery({
    queryKey: ['channel-tasks', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/channels/tasks/${id}`)
      return data.data as ChannelTask
    },
    enabled: !!id,
  })
}

export function useCreateChannelTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateChannelTaskInput) => {
      const { data } = await axiosInstance.post('/api/v1/channels/tasks', input)
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['channel-tasks', data.channel_id, data.channel_subcategory_id] 
      })
    },
  })
}

export function useDeleteChannelTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/v1/channels/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-tasks'] })
    },
  })
}

// Progress & Comments
export function useUpdateProgress() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateProgressInput }) => {
      const { data } = await axiosInstance.post(`/api/v1/channels/tasks/${taskId}/progress`, input)
      return data.data
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific task
      queryClient.invalidateQueries({ queryKey: ['channel-tasks', variables.taskId] })
      // Invalidate all channel tasks lists (including my-tasks)
      queryClient.invalidateQueries({ queryKey: ['channel-tasks'] })
      // Invalidate my channel tasks specifically
      queryClient.invalidateQueries({ queryKey: ['channels', 'my-tasks'] })
      // Invalidate personal channel stats
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'personal-channel-stats'] })
      // Invalidate admin/manager channel stats
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'channel-stats'] })
    },
  })
}

export function useAddChannelComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data } = await axiosInstance.post(`/api/v1/channels/tasks/${taskId}/comments`, { content })
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-tasks', variables.taskId] })
    },
  })
}

// My Channel Tasks (for employees)
export function useMyChannelTasks() {
  return useQuery({
    queryKey: ['channels', 'my-tasks'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/channels/tasks/my-tasks')
      return data.data as ChannelTask[]
    },
  })
}
