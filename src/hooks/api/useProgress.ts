import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SkillDefinition {
  skill_id: string
  skill_name: string
}

export interface CategoryDefinition {
  category_id: string
  category_name: string
  skills: SkillDefinition[]
}

export interface EmployeeProgressSummary {
  id: string
  name: string
  email: string
  job_title?: string
  department_name?: string
  overall_score: number | null
  latest_period: string | null
  last_updated: string | null
}

export interface SkillScore {
  skill_id: string
  skill_name: string
  score: number
  skill_active: boolean
}

export interface CategoryScores {
  category_id: string
  category_name: string
  skills: SkillScore[]
}

export interface EmployeeProgressDetail {
  employee_id: string
  period: string
  overall_score: number | null
  last_updated: string | null
  updated_by_name?: string
  organization_expects?: string
  employee_delivered?: string
  categories: CategoryScores[]
}

export interface ProgressHistoryEntry {
  period: string
  overall_score: number
  updated_at: string
}

export interface SkillManagement {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  category_id: string
  category_name: string
  created_at?: string
}

export interface CategoryManagement {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at?: string
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useSkillDefinitions() {
  return useQuery<CategoryDefinition[]>({
    queryKey: ['progress', 'skill-definitions'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_SKILL_DEFINITIONS)
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProgressList() {
  return useQuery<EmployeeProgressSummary[]>({
    queryKey: ['progress', 'list'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_LIST)
      return data.data || data
    },
    staleTime: 30000,
  })
}

export function useEmployeeProgress(employeeId: string | null, period: string) {
  return useQuery<EmployeeProgressDetail>({
    queryKey: ['progress', 'detail', employeeId, period],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_BY_EMPLOYEE(employeeId!), {
        params: { period },
      })
      return data.data || data
    },
    enabled: !!employeeId && !!period,
    staleTime: 30000,
  })
}

export function useProgressHistory(employeeId: string | null) {
  return useQuery<ProgressHistoryEntry[]>({
    queryKey: ['progress', 'history', employeeId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_HISTORY(employeeId!))
      return data.data || data
    },
    enabled: !!employeeId,
    staleTime: 30000,
  })
}

export function useSaveProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      period,
      skills,
      organization_expects,
      employee_delivered,
    }: {
      employeeId: string
      period: string
      skills: { skill_id: string; score: number }[]
      organization_expects?: string
      employee_delivered?: string
    }) => {
      const body: any = { period, skills }
      if (organization_expects !== undefined) body.organization_expects = organization_expects
      if (employee_delivered !== undefined) body.employee_delivered = employee_delivered
      const { data } = await axiosInstance.post(API.PROGRESS_SAVE_SKILLS(employeeId), body)
      return data.data || data
    },
    onSuccess: (_data, { employeeId }) => {
      qc.invalidateQueries({ queryKey: ['progress', 'list'] })
      qc.invalidateQueries({ queryKey: ['progress', 'detail', employeeId] })
      qc.invalidateQueries({ queryKey: ['progress', 'history', employeeId] })
    },
  })
}

// ── Settings management hooks ──────────────────────────────────────────────

export function useProgressCategories() {
  return useQuery<CategoryManagement[]>({
    queryKey: ['progress', 'categories'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_CATEGORIES)
      // Handle all possible shapes: array, { data: [] }, { categories: [] }, { data: { categories: [] } }
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.data)) return data.data
      if (Array.isArray(data?.categories)) return data.categories
      if (Array.isArray(data?.data?.categories)) return data.data.categories
      return []
    },
    staleTime: 30000,
  })
}

export function useAllProgressSkills() {
  return useQuery<SkillManagement[]>({
    queryKey: ['progress', 'skills-all'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.PROGRESS_SKILLS_ALL)
      // Handle all possible shapes
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.data)) return data.data
      if (Array.isArray(data?.skills)) return data.skills
      if (Array.isArray(data?.data?.skills)) return data.data.skills
      return []
    },
    staleTime: 30000,
  })
}

export function useCreateProgressCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; sort_order?: number }) => {
      const { data } = await axiosInstance.post(API.PROGRESS_CATEGORY_CREATE, body)
      return data.data || data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', 'categories'] }),
  })
}

export function useUpdateProgressCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; sort_order?: number; is_active?: boolean }) => {
      const { data } = await axiosInstance.put(API.PROGRESS_CATEGORY_BY_ID(id), body)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', 'categories'] })
      qc.invalidateQueries({ queryKey: ['progress', 'skill-definitions'] })
    },
  })
}

export function useDeleteProgressCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(API.PROGRESS_CATEGORY_BY_ID(id))
      return data.data || data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', 'categories'] }),
  })
}

export function useCreateProgressSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, name, sort_order }: { categoryId: string; name: string; sort_order?: number }) => {
      const { data } = await axiosInstance.post(API.PROGRESS_SKILL_IN_CATEGORY(categoryId), { name, sort_order })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', 'skills-all'] })
      qc.invalidateQueries({ queryKey: ['progress', 'skill-definitions'] })
    },
  })
}

export function useUpdateProgressSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; is_active?: boolean }) => {
      const { data } = await axiosInstance.put(API.PROGRESS_SKILL_BY_ID(id), body)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', 'skills-all'] })
      qc.invalidateQueries({ queryKey: ['progress', 'skill-definitions'] })
    },
  })
}

export function useDeleteProgressSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(API.PROGRESS_SKILL_BY_ID(id))
      return data.data || data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', 'skills-all'] }),
  })
}
