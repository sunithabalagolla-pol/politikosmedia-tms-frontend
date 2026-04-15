import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min — data considered fresh
      gcTime: 10 * 60 * 1000,         // 10 min — cache garbage collection
      retry: 1,                        // retry failed requests once
      refetchOnWindowFocus: true,      // refetch when user comes back to tab
      refetchOnReconnect: true,        // refetch when network reconnects
    },
    mutations: {
      retry: 0,
    },
  },
})
