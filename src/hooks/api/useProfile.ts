import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

export interface ProfileData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
  status: string
  job_title: string | null
  location: string | null
  bio: string | null
  department: string | null
}

export interface ActivityItem {
  id: string
  action_type: string
  description: string
  entity_type: string
  entity_id: string
  created_at: string
}

// GET /api/v1/profile
export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROFILE)
      return data.data || data
    },
  })
}

// PUT /api/v1/profile — only editable fields: name, job_title, location, bio
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (profile: {
      name?: string
      job_title?: string
      location?: string
      bio?: string
    }) => {
      const { data } = await axiosInstance.put(API.PROFILE, profile)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// POST /api/v1/profile/avatar — skip for now (needs S3)
export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await axiosInstance.post(API.PROFILE_AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// DELETE /api/v1/profile/avatar — skip for now
export function useDeleteAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.delete(API.PROFILE_AVATAR)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// GET /api/v1/profile/activity?limit=10
export function useProfileActivity(limit = 10) {
  return useQuery<ActivityItem[]>({
    queryKey: ['profile', 'activity', limit],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROFILE_ACTIVITY, {
        params: { limit },
      })
      return data.data || data
    },
  })
}
