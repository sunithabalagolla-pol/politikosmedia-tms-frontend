import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

interface TeamFilters {
  status?: string
  department?: string
  role?: string
  page?: number
  limit?: number
}

export function useTeam(filters: TeamFilters = {}) {
  return useQuery({
    queryKey: ['team', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.TEAM, { params: filters })
      return data.data || data
    },
  })
}

export function useAddTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (member: { name: string; email: string; role?: string; department_id?: string; job_title?: string; location?: string }) => {
      const { data } = await axiosInstance.post(API.TEAM, member)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['lookup'] })
    },
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: any }) => {
      const { data } = await axiosInstance.put(API.TEAM_MEMBER(id), body)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      qc.invalidateQueries({ queryKey: ['lookup'] })
    },
  })
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await axiosInstance.patch(API.TEAM_MEMBER_STATUS(id), { status })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
    },
  })
}
