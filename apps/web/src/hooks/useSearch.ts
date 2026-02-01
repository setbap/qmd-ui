/**
 * useAppSearch hook - Manages search with URL sync
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { search, type SearchMode } from '@/lib/server/qmd'
import type { SearchResult } from '@/components/SearchResults'

const SEARCH_KEY = 'search'

interface UseAppSearchReturn {
  query: string
  setQuery: (query: string) => void
  mode: SearchMode
  setMode: (mode: SearchMode) => void
  cycleMode: () => void
  collection: string | null
  selectCollection: (name: string | null) => void
  results: SearchResult[]
  isLoading: boolean
  error: Error | null
  executeSearch: (params?: {
    query?: string
    mode?: SearchMode
    collection?: string | null
  }) => void
}

export function useAppSearch(): UseAppSearchReturn {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/' })

  // Initialize from URL params
  const [query, setQuery] = useState<string>(
    (searchParams as Record<string, string | undefined>).q ?? '',
  )
  const [mode, setMode] = useState<SearchMode>(
    ((searchParams as Record<string, string | undefined>).m as SearchMode) ??
      'query',
  )
  const [collection, setCollection] = useState<string | null>(
    (searchParams as Record<string, string | undefined>).c ?? null,
  )

  // Update URL with given params
  const updateUrl = useCallback(
    (
      params: {
        query?: string
        mode?: SearchMode
        collection?: string | null
      } = {},
    ) => {
      const searchParams: Record<string, string> = {}
      const q = params.query ?? query
      const m = params.mode ?? mode
      const c = params.collection !== undefined ? params.collection : collection

      if (q) searchParams.q = q
      if (m !== 'query') searchParams.m = m
      if (c) searchParams.c = c
      navigate({
        to: '/',
        search: searchParams,
        replace: true,
      })
    },
    [query, mode, collection, navigate],
  )

  // Search query
  const searchQuery = useQuery({
    queryKey: [SEARCH_KEY, query, mode, collection],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      const result = await search({
        data: {
          query,
          mode,
          collection,
          limit: 20,
        },
      } as any)
      return result as SearchResult[]
    },
    enabled: !!query.trim(),
    staleTime: 1000 * 60, // 1 minute
  })

  // Execute search with current or provided params
  const executeSearch = useCallback(
    (params?: {
      query?: string
      mode?: SearchMode
      collection?: string | null
    }) => {
      updateUrl(params)
      // Refetch with current state (queryKey will have latest values after state updates)
      const searchQuery_val = params?.query ?? query
      if (searchQuery_val.trim()) {
        searchQuery.refetch()
      }
    },
    [updateUrl, searchQuery, query],
  )

  // Cycle through search modes
  const cycleMode = useCallback(() => {
    const modes: SearchMode[] = ['search', 'vsearch', 'query']
    const currentIndex = modes.indexOf(mode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    if (nextMode) {
      setMode(nextMode)
    }
  }, [mode])

  // Set active collection
  const selectCollection = useCallback((name: string | null) => {
    setCollection(name)
  }, [])

  return {
    query,
    setQuery,
    mode,
    setMode,
    cycleMode,
    collection,
    selectCollection,
    results: (searchQuery.data ?? []) as SearchResult[],
    isLoading: searchQuery.isLoading,
    error: searchQuery.error as Error | null,
    executeSearch,
  }
}
