import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { search, type SearchMode } from '@/lib/server/qmd'

export interface SearchHistoryItem {
  id: string
  query: string
  mode: SearchMode
  collection: string | null
  timestamp: number
}

export interface SearchResult {
  filepath: string
  displayPath: string
  title: string | null
  body: string | null
  score: number
  source: 'fts' | 'vec'
  modifiedAt: string
  bodyLength: number
  collectionName: string
  docid: string
  hash: string
  context: string | null
}

interface SearchState {
  // Search params
  query: string
  mode: SearchMode
  collection: string | null

  // Search results
  results: SearchResult[]
  isLoading: boolean
  error: Error | null

  // History
  history: SearchHistoryItem[]

  // Actions
  setQuery: (query: string) => void
  setMode: (mode: SearchMode) => void
  setCollection: (collection: string | null) => void
  cycleMode: () => void

  // Search execution
  executeSearch: (limit?: number, minScore?: number) => Promise<void>
  clearResults: () => void

  // History management
  addToHistory: (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  loadHistoryItem: (item: SearchHistoryItem) => void
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      mode: 'query',
      collection: null,
      results: [],
      isLoading: false,
      error: null,
      history: [],

      setQuery: (query) => set({ query }),
      setMode: (mode) => set({ mode }),
      setCollection: (collection) => set({ collection }),

      cycleMode: () => {
        const modes: SearchMode[] = ['search', 'vsearch', 'query']
        const currentIndex = modes.indexOf(get().mode)
        const nextMode = modes[(currentIndex + 1) % modes.length]
        set({ mode: nextMode! })
      },

      executeSearch: async (limit?: number, minScore?: number) => {
        const { query, mode, collection } = get()

        if (!query.trim()) {
          set({ results: [], error: null })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const results = await search({
            data: {
              query: query.trim(),
              mode,
              collection,
              limit: limit ?? 20,
              minScore: minScore ?? 0,
            },
          } as any)

          set({
            results: results as SearchResult[],
            isLoading: false,
          })

          // Add to history
          get().addToHistory({
            query: query.trim(),
            mode,
            collection,
          })
        } catch (err) {
          set({
            error: err instanceof Error ? err : new Error('Search failed'),
            isLoading: false,
            results: [],
          })
        }
      },

      clearResults: () => set({ results: [], error: null }),

      addToHistory: (item) => {
        const { history } = get()

        // Don't add duplicates (same query, mode, collection)
        const isDuplicate = history.some(
          (h) =>
            h.query === item.query &&
            h.mode === item.mode &&
            h.collection === item.collection,
        )

        if (isDuplicate) return

        const newItem: SearchHistoryItem = {
          ...item,
          id: generateId(),
          timestamp: Date.now(),
        }

        set({
          history: [newItem, ...history].slice(0, 100),
        })
      },

      removeFromHistory: (id) => {
        set({
          history: get().history.filter((h) => h.id !== id),
        })
      },

      clearHistory: () => set({ history: [] }),

      loadHistoryItem: (item) => {
        set({
          query: item.query,
          mode: item.mode,
          collection: item.collection,
        })
      },
    }),
    {
      name: 'qmd-search-history',
      partialize: (state) => ({ history: state.history }),
    },
  ),
)
