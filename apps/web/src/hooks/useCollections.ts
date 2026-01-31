/**
 * useCollections hook - Manages collections list with auto-refresh
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import {
  getCollections,
  getCollectionFiles,
  createCollection,
  deleteCollection,
  renameCollectionFn,
  updateCollection,
} from '@/lib/server/qmd'

const COLLECTIONS_KEY = 'collections'
const COLLECTION_FILES_KEY = 'collection-files'

export function useCollections() {
  const queryClient = useQueryClient()
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(),
  )

  // Main collections query
  const collectionsQuery = useQuery({
    queryKey: [COLLECTIONS_KEY],
    queryFn: async () => {
      const result = await getCollections()
      return result
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // Auto-refresh with visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [queryClient])

  // Collection files query (for expanded collections)
  const getCollectionFilesQuery = useCallback(
    (collectionName: string | null) => {
      return useQuery({
        queryKey: [COLLECTION_FILES_KEY, collectionName],
        queryFn: async () => {
          if (!collectionName) return []
          const result = await getCollectionFiles({
            query: { name: collectionName },
          } as any)
          return result
        },
        enabled: !!collectionName && expandedCollections.has(collectionName),
        staleTime: 1000 * 60, // 1 minute
      })
    },
    [expandedCollections],
  )

  // Toggle collection expansion
  const toggleExpand = useCallback((name: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string
      path: string
      pattern?: string
    }) => {
      const result = await createCollection({ data } as any)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
    },
  })

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await deleteCollection({ data: { name } } as any)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
    },
  })

  // Rename collection mutation
  const renameMutation = useMutation({
    mutationFn: async (data: { oldName: string; newName: string }) => {
      const result = await renameCollectionFn({ data } as any)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
    },
  })

  // Update (re-index) collection mutation
  const updateMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await updateCollection({ data: { name } } as any)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [COLLECTION_FILES_KEY] })
    },
  })

  return {
    collections: collectionsQuery.data ?? [],
    isLoading: collectionsQuery.isLoading,
    error: collectionsQuery.error,
    expandedCollections,
    toggleExpand,
    getCollectionFilesQuery,
    createCollection: createMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    renameCollection: renameMutation.mutateAsync,
    updateCollection: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRenaming: renameMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
