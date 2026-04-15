import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

// GET /api/v1/calendar - Fetch calendar data (tasks with due dates)
export function useCalendar(month: number, year: number, categoryId?: string, phaseId?: string) {
  return useQuery({
    queryKey: ['calendar', month, year, categoryId, phaseId],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('month', month.toString())
      params.append('year', year.toString())
      if (categoryId) params.append('category_id', categoryId)
      if (phaseId) params.append('phase_id', phaseId)
      
      const { data } = await axiosInstance.get(`/api/v1/calendar?${params}`)
      return data.data || data
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  })
}
