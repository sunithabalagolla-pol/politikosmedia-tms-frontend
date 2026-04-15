import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import API from '../../api/endpoints'

// Department dropdown options (for task creation forms)
export function useLookupDepartments() {
  return useQuery({
    queryKey: ['lookup', 'departments'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.LOOKUP_DEPARTMENTS)
      return data.data || data
    },
    staleTime: 10 * 60 * 1000, // Cache 10 min — departments don't change often
  })
}

// Employee dropdown options (for task assignment)
export function useLookupEmployees() {
  return useQuery({
    queryKey: ['lookup', 'employees'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(API.LOOKUP_EMPLOYEES)
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
}
