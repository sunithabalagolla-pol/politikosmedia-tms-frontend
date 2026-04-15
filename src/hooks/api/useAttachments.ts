import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Upload file attachment to a task — appends to cache directly
export function useUploadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string | number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axiosInstance.post(API.TASK_ATTACHMENTS(taskId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data || data
    },
    onSuccess: (newAttachment, { taskId }) => {
      const id = String(taskId)
      qc.setQueryData(['tasks', id], (old: any) => {
        if (!old) return old
        return { ...old, attachments: [...(old.attachments || []), newAttachment] }
      })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

// Delete attachment
export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attachmentId: string | number) => {
      const { data } = await axiosInstance.delete(API.ATTACHMENT_DELETE(attachmentId))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}
