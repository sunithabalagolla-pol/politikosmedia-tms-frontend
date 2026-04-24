import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

// Types
export interface Show {
  id: string
  name: string
  description: string | null
  created_by: string
  created_by_name?: string
  episode_count?: number
  created_at: string
  updated_at: string
}

export type EpisodeStatus = 'production' | 'approved' | 'ready_for_broadcast' | 'broadcasted'

export interface EpisodeAsset {
  id: string
  episode_id: string
  name: string
  is_checked: boolean
  checked_at: string | null
  sort_order: number
}

export interface ShowImpactTask {
  id: string
  episode_id: string
  show_id: string
  assigned_to: string
  created_by: string
  notes: string | null
  show_name?: string
  episode_title?: string
  episode_number?: number
  episode_status?: string
  assigned_to_name?: string
  created_by_name?: string
  created_at: string
}

export interface ShowEpisode {
  id: string
  show_id: string
  title: string
  episode_number: number
  target_duration: string | null
  status: EpisodeStatus
  approved_at: string | null
  broadcasted_at: string | null
  show_name?: string
  show_description?: string
  assets?: EpisodeAsset[]
  total_assets?: number
  checked_assets?: number
  all_assets_checked?: boolean
  impact_tasks?: ShowImpactTask[]
  impact_notes?: ShowImpactTask[]
  is_show_only?: boolean
  created_by_name?: string
  created_at: string
  updated_at: string
}

export interface ShowBoardView {
  creation_production: ShowEpisode[]
  broadcasting: ShowEpisode[]
  broadcasted: ShowEpisode[]
  impact: ShowEpisode[]
}

// Show Details (rich summary for popup)
export interface ShowDetailsImpactNote {
  id: string
  notes: string | null
  created_at: string
  assigned_to_name: string
  assigned_to_avatar: string | null
}

export interface ShowDetailsEpisode {
  id: string
  episode_number: number
  title: string
  target_duration: string | null
  status: EpisodeStatus
  approved_at: string | null
  broadcasted_at: string | null
  total_assets: number
  checked_assets: number
  all_assets_checked: boolean
  impact_notes: ShowDetailsImpactNote[]
}

export interface ShowDetails {
  id: string
  name: string
  description: string | null
  created_by_name: string
  created_at: string
  episode_count: number
  status_breakdown: {
    production: number
    approved: number
    ready_for_broadcast: number
    broadcasted: number
  }
  asset_summary: {
    total: number
    checked: number
    completion_percentage: number
  }
  episodes: ShowDetailsEpisode[]
}

// Queries
export function useShowBoard() {
  return useQuery({
    queryKey: ['shows', 'board'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/shows/board')
      return (data.data || data) as ShowBoardView
    },
  })
}

export function useShow(showId: string) {
  return useQuery({
    queryKey: ['shows', showId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/shows/${showId}`)
      return (data.data || data) as Show & { episodes?: ShowEpisode[] }
    },
    enabled: !!showId,
  })
}

export function useShowDetails(showId: string) {
  return useQuery({
    queryKey: ['shows', showId, 'details'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/shows/${showId}/details`)
      return (data.data || data) as ShowDetails
    },
    enabled: !!showId,
  })
}

export function useShowEpisodes(showId: string) {
  return useQuery({
    queryKey: ['shows', showId, 'episodes'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/shows/${showId}/episodes`)
      return (data.data || []) as ShowEpisode[]
    },
    enabled: !!showId,
  })
}

export function useMyShowTasks() {
  return useQuery({
    queryKey: ['shows', 'my-tasks'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/shows/my-tasks')
      return (data.data || []) as ShowImpactTask[]
    },
  })
}

// Mutations
export function useCreateShow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await axiosInstance.post('/api/v1/shows', input)
      return data.data as Show
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useUpdateShow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ showId, input }: { showId: string; input: { name: string; description?: string } }) => {
      const { data } = await axiosInstance.put(`/api/v1/shows/${showId}`, input)
      return data.data
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['shows', v.showId] })
      qc.invalidateQueries({ queryKey: ['shows', 'board'] })
    },
  })
}

export function useCreateEpisode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ showId, input }: { showId: string; input: { title: string; episode_number: number; target_duration?: string } }) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/${showId}/episodes`, input)
      return data.data
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['shows', v.showId, 'episodes'] })
      qc.invalidateQueries({ queryKey: ['shows', 'board'] })
    },
  })
}

export function useAddAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ episodeId, name }: { episodeId: string; name: string }) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/episodes/${episodeId}/assets`, { name })
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useRemoveAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (assetId: string) => {
      await axiosInstance.delete(`/api/v1/shows/assets/${assetId}`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useToggleAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data } = await axiosInstance.patch(`/api/v1/shows/assets/${assetId}/toggle`)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useApproveEpisode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (episodeId: string) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/episodes/${episodeId}/approve`)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows'] })
    },
  })
}

export function useMarkReadyForBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (episodeId: string) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/episodes/${episodeId}/ready-for-broadcast`)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useMarkBroadcasted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (episodeId: string) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/episodes/${episodeId}/broadcasted`)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useCreateImpactTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ episodeId, assigned_to }: { episodeId: string; assigned_to: string }) => {
      const { data } = await axiosInstance.post(`/api/v1/shows/episodes/${episodeId}/impact`, { assigned_to })
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useUpdateImpactNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes: string }) => {
      const { data } = await axiosInstance.put(`/api/v1/shows/impact/${taskId}/notes`, { notes })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shows', 'my-tasks'] })
      qc.invalidateQueries({ queryKey: ['shows', 'board'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'personal-show-stats'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'show-stats'] })
    },
  })
}

export function useDeleteEpisode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (episodeId: string) => {
      await axiosInstance.delete(`/api/v1/shows/episodes/${episodeId}`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}

export function useDeleteShow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (showId: string) => {
      await axiosInstance.delete(`/api/v1/shows/${showId}`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shows'] }) },
  })
}
