import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Toggle subtask completed
export function useToggleSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ subtaskId, completionNote }: { subtaskId: string | number; completionNote?: string }) => {
      const { data } = await axiosInstance.patch(API.SUBTASK_TOGGLE(subtaskId), 
        completionNote ? { completion_note: completionNote } : {}
      )
      return data.data || data
    },
    onSuccess: () => {
      // Invalidate both task list and any open task detail
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Update subtask title
export function useUpdateSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title }: { id: string | number; title: string }) => {
      const { data } = await axiosInstance.put(API.SUBTASK_UPDATE(id), { title })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

// Add subtask to a task
export function useAddSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string | number; title: string }) => {
      const { data } = await axiosInstance.post(API.TASK_SUBTASKS(taskId), { title })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

// Delete subtask with optional deletion reason
export function useDeleteSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ subtaskId, deletionNote }: { subtaskId: string | number; deletionNote?: string }) => {
      const { data } = await axiosInstance.delete(API.SUBTASK_DELETE(subtaskId), {
        data: deletionNote?.trim() ? { deletion_note: deletionNote.trim() } : undefined,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}
