import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

// Types
export interface Category {
  id: string
  name: string
  description: string
  logo_url?: string | null // NEW: Category logo
  sort_order: number
  phase_count: number
  task_count?: number // Optional: total tasks across all phases
  created_at: string
  updated_at: string
}

export interface Phase {
  id: string
  category_id: string
  name: string
  description: string
  order_index: number
  task_count?: number // Optional: task count for this phase
  created_at: string
  updated_at: string
}

export interface CategoryWithPhases extends Category {
  phases: Phase[]
}

export interface CreateCategoryInput {
  name: string
  description?: string
  sort_order?: number
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  sort_order?: number
}

// Hooks

// Get all categories with phase count
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/categories')
      return data.data as Category[]
    },
    staleTime: 30000, // 30s
  })
}

// Get only categories where employee has assigned tasks
export function useAssignedCategories() {
  return useQuery({
    queryKey: ['categories', 'assigned'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/v1/categories/assigned')
      return data.data as Category[]
    },
    staleTime: 30000, // 30s
  })
}

// Get single category with all its phases
export function useCategory(id: string | null) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/v1/categories/${id}`)
      return data.data as CategoryWithPhases
    },
    enabled: !!id,
  })
}

// Create category
export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data } = await axiosInstance.post('/api/v1/categories', input)
      return data.data as Category
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Update category
export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: UpdateCategoryInput }) => {
      const { data } = await axiosInstance.put(`/api/v1/categories/${id}`, input)
      return data.data as Category
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['categories', variables.id] })
    },
  })
}

// Delete category (only if no phases)
export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(`/api/v1/categories/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Upload category logo
export function useUploadCategoryLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, file }: { categoryId: string; file: File }) => {
      const formData = new FormData()
      formData.append('logo', file)
      
      const { data } = await axiosInstance.post(
        `/api/v1/categories/${categoryId}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return data.data as Category
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['categories', variables.categoryId] })
    },
  })
}
