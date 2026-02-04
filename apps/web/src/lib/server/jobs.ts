/**
 * Simple in-memory job system for background indexing operations
 * Uses TanStack Start server functions for async job execution
 */

import type { IndexingProgress, IndexingResult } from '@qmd/utility'

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface IndexingJob {
  id: string
  type: 'indexing'
  collectionName: string
  status: JobStatus
  progress: IndexingProgress | null
  result: IndexingResult | null
  error: string | null
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
  abortController?: AbortController
}

/**
 * Serializable version of IndexingJob for API responses
 * Excludes the non-serializable abortController
 */
export interface SerializableIndexingJob {
  id: string
  type: 'indexing'
  collectionName: string
  status: JobStatus
  progress: IndexingProgress | null
  result: IndexingResult | null
  error: string | null
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
}

// In-memory job store - persists for server lifetime
const jobStore = new Map<string, IndexingJob>()

let jobIdCounter = 0

function generateJobId(): string {
  return `job-${Date.now()}-${++jobIdCounter}`
}

export function createIndexingJob(collectionName: string): IndexingJob {
  const job: IndexingJob = {
    id: generateJobId(),
    type: 'indexing',
    collectionName,
    status: 'pending',
    progress: null,
    result: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    abortController: new AbortController(),
  }

  jobStore.set(job.id, job)
  return job
}

export function getJob(jobId: string): IndexingJob | undefined {
  return jobStore.get(jobId)
}

export function updateJob(
  jobId: string,
  updates: Partial<
    Omit<IndexingJob, 'id' | 'type' | 'collectionName' | 'createdAt'>
  >,
): IndexingJob | undefined {
  const job = jobStore.get(jobId)
  if (!job) return undefined

  const updated = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  }

  jobStore.set(jobId, updated)
  return updated
}

export function completeJob(
  jobId: string,
  result: IndexingResult,
): IndexingJob | undefined {
  return updateJob(jobId, {
    status: 'completed',
    result,
    completedAt: Date.now(),
  })
}

export function failJob(
  jobId: string,
  error: Error | string,
): IndexingJob | undefined {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return updateJob(jobId, {
    status: 'failed',
    error: errorMessage,
    completedAt: Date.now(),
  })
}

export function cancelJob(jobId: string): IndexingJob | undefined {
  const job = jobStore.get(jobId)
  if (!job) return undefined

  // Abort the ongoing operation
  job.abortController?.abort()

  return updateJob(jobId, {
    status: 'cancelled',
    completedAt: Date.now(),
  })
}

export function startJob(jobId: string): IndexingJob | undefined {
  return updateJob(jobId, {
    status: 'running',
    startedAt: Date.now(),
  })
}

export function updateJobProgress(
  jobId: string,
  progress: IndexingProgress,
): IndexingJob | undefined {
  return updateJob(jobId, { progress })
}

export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now()
  let cleaned = 0

  for (const [id, job] of jobStore) {
    // Remove completed/failed/cancelled jobs older than maxAge
    if (
      (job.status === 'completed' ||
        job.status === 'failed' ||
        job.status === 'cancelled') &&
      now - (job.completedAt || job.updatedAt) > maxAgeMs
    ) {
      jobStore.delete(id)
      cleaned++
    }
  }

  return cleaned
}

export function listJobs(): IndexingJob[] {
  return Array.from(jobStore.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export function getActiveJobs(): IndexingJob[] {
  return listJobs().filter(
    (job) => job.status === 'pending' || job.status === 'running',
  )
}

/**
 * Convert an IndexingJob to a serializable format (removes AbortController)
 */
export function toSerializableJob(job: IndexingJob): SerializableIndexingJob {
  return {
    id: job.id,
    type: job.type,
    collectionName: job.collectionName,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  }
}
