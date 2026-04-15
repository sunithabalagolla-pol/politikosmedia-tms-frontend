import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

interface KanbanFilters {
  category_id?: string
  phase_id?: string
}

// Get kanban columns with tasks (with optional filters)
export function useKanban(filters?: KanbanFilters) {
  return useQuery({
    queryKey: ['kanban', filters],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.KANBAN, { params: filters })
      return data.data || data
    },
  })
}

// Reorder after drag-and-drop
export function useKanbanReorder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { taskId: string; fromColumn: string; toColumn: string; newIndex: number }) => {
      const { data } = await axiosInstance.patch(API.KANBAN_REORDER, payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}
