/**
 * useSettings hook - Manages app settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings, type AppSettings } from '@/lib/server/qmd'

const SETTINGS_KEY = 'settings'

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: async () => {
      const result = await getSettings()
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      const result = await updateSettings({ data } as any)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })

  return {
    settings: settingsQuery.data ?? {
      outputFormat: 'text',
      resultsPerPage: 20,
    },
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
