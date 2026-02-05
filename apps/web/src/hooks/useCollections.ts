/**
 * useCollections hook - Manages collections list with auto-refresh
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getCollections,
  getCollectionFiles,
  createCollection,
  deleteCollection,
  renameCollectionFn,
  updateCollection,
  getJobStatus,
  type CreateCollectionResult,
  type SerializableIndexingJob,
} from '@/lib/server/qmd'

const COLLECTIONS_KEY = 'collections'
const COLLECTION_FILES_KEY = 'collection-files'

export interface CollectionJob {
  jobId: string
  collectionName: string
  status: SerializableIndexingJob['status']
  progress: SerializableIndexingJob['progress']
  error: string | null
}

export function useCollections() {
  const queryClient = useQueryClient()
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(),
  )
  const [activeJobs, setActiveJobs] = useState<Map<string, CollectionJob>>(
    new Map(),
  )
  const pollingIntervalsRef = useRef<
    Map<string, ReturnType<typeof setInterval>>
  >(new Map())

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

  // Collection files - direct async function for components
  const fetchCollectionFiles = useCallback(
    async (
      collectionName: string,
    ): Promise<Array<{ path: string; title?: string }>> => {
      const result = await getCollectionFiles({
        data: { name: collectionName },
      })
      return result.map((path: string) => ({
        path,
        title: path.split('/').pop(),
      }))
    },
    [],
  )

  // Collection files query (for expanded collections - hook version)
  const getCollectionFilesQuery = useCallback(
    (collectionName: string | null) => {
      return useQuery({
        queryKey: [COLLECTION_FILES_KEY, collectionName],
        queryFn: async () => {
          if (!collectionName) return []
          return fetchCollectionFiles(collectionName)
        },
        enabled: !!collectionName && expandedCollections.has(collectionName),
        staleTime: 1000 * 60, // 1 minute
      })
    },
    [expandedCollections, fetchCollectionFiles],
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

  // Start polling for job status
  const startJobPolling = useCallback(
    (jobId: string, collectionName: string) => {
      // Clear any existing interval for this job
      if (pollingIntervalsRef.current.has(jobId)) {
        clearInterval(pollingIntervalsRef.current.get(jobId)!)
      }

      // Create new polling interval (every 500ms)
      const interval = setInterval(async () => {
        try {
          const job = await getJobStatus({ data: { jobId } })

          if (!job) {
            // Job not found, stop polling
            clearInterval(interval)
            pollingIntervalsRef.current.delete(jobId)
            setActiveJobs((prev) => {
              const next = new Map(prev)
              next.delete(jobId)
              return next
            })
            return
          }

          // Update job in state
          setActiveJobs((prev) => {
            const next = new Map(prev)
            next.set(jobId, {
              jobId: job.id,
              collectionName: job.collectionName,
              status: job.status,
              progress: job.progress,
              error: job.error,
            })
            return next
          })

          // Check if job is complete/failed/cancelled
          if (['completed', 'failed', 'cancelled'].includes(job.status)) {
            clearInterval(interval)
            pollingIntervalsRef.current.delete(jobId)

            // Invalidate collections and files to refresh UI
            queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
            queryClient.invalidateQueries({
              queryKey: [COLLECTION_FILES_KEY, collectionName],
            })

            if (job.status === 'completed') {
              setExpandedCollections((prev) => {
                const next = new Set(prev)
                next.add(collectionName)
                return next
              })
            }
          }
        } catch (error) {
          console.error('Failed to get job status:', error)
          clearInterval(interval)
          pollingIntervalsRef.current.delete(jobId)
        }
      }, 500)

      pollingIntervalsRef.current.set(jobId, interval)
    },
    [queryClient],
  )

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string
      path: string
      pattern?: string
    }) => {
      const result = (await createCollection({
        data,
      } as any)) as CreateCollectionResult
      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })

      // Start polling for this job
      if (result.jobId) {
        startJobPolling(result.jobId, result.name)
      }
    },
  })

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await deleteCollection({ data: { name } } as any)
      return result
    },
    onSuccess: (_, variables) => {
      toast.success(`Collection "${variables}" deleted successfully`)
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
    },
  })

  // Rename collection mutation
  const renameMutation = useMutation({
    mutationFn: async (data: { oldName: string; newName: string }) => {
      const result = await renameCollectionFn({ data } as any)
      return result
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Collection "${variables.oldName}" renamed to "${variables.newName}" successfully`,
      )
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
    },
  })

  // Update (re-index) collection mutation
  const updateMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await updateCollection({ data: { name } } as any)
      return result
    },
    onSuccess: (_, variables) => {
      toast.success(`Collection "${variables}" updated successfully`)
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [COLLECTION_FILES_KEY] })
    },
    onError: (error, variables) => {
      console.error('Failed to update collection:', error)
      toast.error(`Failed to update collection "${variables}"`)
    },
  })

  // Get jobs for a specific collection
  const getCollectionJobs = useCallback(
    (collectionName: string): CollectionJob[] => {
      return Array.from(activeJobs.values()).filter(
        (job) => job.collectionName === collectionName,
      )
    },
    [activeJobs],
  )

  // Check if a collection has an active indexing job
  const isCollectionIndexing = useCallback(
    (collectionName: string): boolean => {
      return getCollectionJobs(collectionName).some(
        (job) => job.status === 'pending' || job.status === 'running',
      )
    },
    [getCollectionJobs],
  )

  return {
    collections: collectionsQuery.data ?? [],
    isLoading: collectionsQuery.isLoading,
    error: collectionsQuery.error,
    expandedCollections,
    toggleExpand,
    getCollectionFilesQuery,
    fetchCollectionFiles,
    createCollection: createMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    renameCollection: renameMutation.mutateAsync,
    updateCollection: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRenaming: renameMutation.isPending,
    isUpdating: updateMutation.isPending,
    activeJobs,
    getCollectionJobs,
    isCollectionIndexing,
  }
}
