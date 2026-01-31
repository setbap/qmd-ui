/**
 * useFileContent hook - Fetches file content for viewing
 */

import { useQuery } from '@tanstack/react-query'
import { getFileContent } from '@/lib/server/qmd'

const FILE_CONTENT_KEY = 'file-content'

export function useFileContent(
  path: string | null,
  collection?: string | null,
) {
  return useQuery({
    queryKey: [FILE_CONTENT_KEY, path, collection],
    queryFn: async () => {
      if (!path) return null
      const params: Record<string, string> = { path }
      if (collection) params.collection = collection
      const result = await getFileContent({ query: params } as any)
      return result
    },
    enabled: !!path,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
