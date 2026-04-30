import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// ── FAQ Hooks ──

/** Active FAQs only (for employees / public view) */
export function useFaqs() {
  return useQuery({
    queryKey: ['help', 'faqs'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.HELP_FAQS)
      return data.data || data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/** ALL FAQs including inactive (admin/manager only) */
export function useAllFaqs() {
  return useQuery({
    queryKey: ['help', 'faqs', 'all'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.HELP_FAQS_ALL)
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Create a new FAQ */
export function useCreateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (faq: { question: string; answer: string; sort_order?: number; is_active?: boolean }) => {
      const { data } = await axiosInstance.post(API.HELP_FAQS, faq)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'faqs'] })
    },
  })
}

/** Update an existing FAQ */
export function useUpdateFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string | number; question?: string; answer?: string; sort_order?: number; is_active?: boolean }) => {
      const { data } = await axiosInstance.put(API.HELP_FAQ_BY_ID(id), body)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'faqs'] })
    },
  })
}

/** Delete a FAQ permanently */
export function useDeleteFaq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await axiosInstance.delete(API.HELP_FAQ_BY_ID(id))
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'faqs'] })
    },
  })
}

export interface TicketFilters {
  status?: string
  category_id?: string
  phase_id?: string
  page?: number
  limit?: number
}

export function useSubmitTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticket: { subject: string; description: string; category_id?: string; phase_id?: string }) => {
      const { data } = await axiosInstance.post(API.HELP_TICKETS, ticket)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'tickets'] })
    },
  })
}

export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ['help', 'tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.phase_id) params.append('phase_id', filters.phase_id)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      
      const queryString = params.toString()
      const url = `${API.HELP_TICKETS}${queryString ? `?${queryString}` : ''}`
      const { data } = await axiosInstance.get(url)
      return data.data || data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status: string; admin_note?: string }) => {
      const { data } = await axiosInstance.patch(`/api/v1/help/tickets/${id}/status`, { status, admin_note })
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'tickets'] })
    },
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(`/api/v1/help/tickets/${id}`)
      return data.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help', 'tickets'] })
    },
  })
}
