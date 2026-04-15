import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Global search
export function useSearch(query: string, type?: string) {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.SEARCH, {
        params: { q: query, type },
      })
      return data.data || data
    },
    enabled: query.length >= 2, // Only search when 2+ characters typed
    staleTime: 10 * 1000,       // Cache search results for 10s
  })
}
