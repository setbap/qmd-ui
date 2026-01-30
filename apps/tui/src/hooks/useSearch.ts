/**
 * useSearch hook - Manages search state and operations
 * SolidJS reactive hook with mode switching
 * Search only happens on Enter key, not auto
 * 
 * Search logic based on CLI implementation:
 * - search: BM25 FTS with optional collection filter
 * - vsearch: Vector similarity search with optional collection filter
 * - query: Hybrid search (FTS + Vector) with RRF fusion
 */

import { createSignal, batch } from "solid-js";
import type { SearchResult, Store, RankedResult } from "@qmd/core";
import {
  createStore,
  searchFTS,
  searchVec,
  DEFAULT_EMBED_MODEL,
  getContextForFile,
  reciprocalRankFusion,
} from "@qmd/core";
import type { SearchMode, TUISettings } from "../types/tui.js";

export interface UseSearchReturn {
  readonly query: () => string;
  readonly setQuery: (query: string) => void;
  readonly mode: () => SearchMode;
  readonly setMode: (mode: SearchMode) => void;
  readonly cycleMode: () => void;
  readonly results: () => readonly SearchResult[];
  readonly isLoading: () => boolean;
  readonly error: () => string | null;
  readonly executeSearch: (collectionName?: string | null) => Promise<void>;
}

/**
 * Create a reactive search hook
 * Search only executes on Enter (no auto-search)
 */
export function useSearch(settings: () => TUISettings): UseSearchReturn {
  // Initialize store once
  let storeInstance: Store | null = null;

  // State using signals
  const [query, setQuerySignal] = createSignal("");
  const [mode, setModeSignal] = createSignal<SearchMode>("query");
  const [results, setResults] = createSignal<readonly SearchResult[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Initialize store
  const getStore = async (): Promise<Store> => {
    if (!storeInstance) {
      storeInstance = await createStore();
    }
    return storeInstance;
  };

  /**
   * Execute BM25 FTS search
   */
  const executeFTS = async (
    store: Store,
    currentQuery: string,
    limit: number,
    collectionName?: string | null,
  ): Promise<SearchResult[]> => {
    const fetchLimit = Math.max(50, limit * 2);
    const ftsResults = searchFTS(
      store.db,
      currentQuery,
      fetchLimit,
      (collectionName || "") as any,
    );
    
    // Add context to results
    return ftsResults.slice(0, limit).map((r) => ({
      ...r,
      context: getContextForFile(store.db, r.filepath),
    }));
  };

  /**
   * Execute vector search
   */
  const executeVector = async (
    store: Store,
    currentQuery: string,
    limit: number,
    collectionName?: string | null,
  ): Promise<SearchResult[]> => {
    // Check if vectors table exists
    const tableExists = store.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='vectors_vec'`,
      )
      .get();
    
    if (!tableExists) {
      throw new Error("Vector index not found. Run 'qmd embed' first to create embeddings.");
    }

    const vecResults = await searchVec(
      store.db,
      currentQuery,
      DEFAULT_EMBED_MODEL,
      limit,
      (collectionName || "") as any,
    );
    
    // Add context to results
    return vecResults.map((r) => ({
      ...r,
      context: getContextForFile(store.db, r.filepath),
    }));
  };

  /**
   * Execute hybrid search (FTS + Vector with RRF fusion)
   * Simplified version of CLI's querySearch
   */
  const executeHybrid = async (
    store: Store,
    currentQuery: string,
    limit: number,
    collectionName?: string | null,
  ): Promise<SearchResult[]> => {
    // Check if vectors table exists
    const hasVectors = !!store.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='vectors_vec'`,
      )
      .get();

    // Run initial FTS search
    const initialFts = searchFTS(
      store.db,
      currentQuery,
      20,
      (collectionName || "") as any,
    );

    // Check for strong signal - if top result is strong, just use FTS results
    const topScore = initialFts[0]?.score ?? 0;
    const secondScore = initialFts[1]?.score ?? 0;
    const hasStrongSignal =
      initialFts.length > 0 && topScore >= 0.85 && topScore - secondScore >= 0.15;

    // If strong signal, return FTS results directly with context
    if (hasStrongSignal) {
      return initialFts.slice(0, limit).map((r) => ({
        ...r,
        context: getContextForFile(store.db, r.filepath),
      }));
    }

    // Otherwise, do hybrid search with RRF fusion
    const rankedLists: RankedResult[][] = [];

    // Add FTS results as first ranked list
    if (initialFts.length > 0) {
      rankedLists.push(
        initialFts.map((r) => ({
          file: r.filepath,
          displayPath: r.displayPath,
          title: r.title,
          body: r.body || "",
          score: r.score,
        })),
      );
    }

    // Add vector results as second ranked list (if vectors exist)
    if (hasVectors) {
      const vecResults = await searchVec(
        store.db,
        currentQuery,
        DEFAULT_EMBED_MODEL,
        20,
        (collectionName || "") as any,
      );
      
      if (vecResults.length > 0) {
        rankedLists.push(
          vecResults.map((r) => ({
            file: r.filepath,
            displayPath: r.displayPath,
            title: r.title,
            body: r.body || "",
            score: r.score,
          })),
        );
      }
    }

    // If no results from either search, return empty
    if (rankedLists.length === 0) {
      return [];
    }

    // Apply Reciprocal Rank Fusion
    const fused = reciprocalRankFusion(rankedLists);

    // Build final results from fused scores
    const finalResults: SearchResult[] = fused.slice(0, limit).map((fused) => {
      // Find the original result to get full data
      const originalFts = initialFts.find((r) => r.filepath === fused.file);
      
      if (originalFts) {
        // Return with updated score from fusion
        return {
          ...originalFts,
          score: fused.score,
          context: getContextForFile(store.db, fused.file),
        };
      }
      
      // If not found in FTS, try to construct from fused data
      // This handles results that only came from vector search
      return {
        filepath: fused.file,
        displayPath: fused.displayPath,
        title: fused.title,
        body: fused.body,
        score: fused.score,
        context: getContextForFile(store.db, fused.file),
        hash: "",
        docid: "",
        collectionName: "",
        modifiedAt: "",
        bodyLength: 0,
        source: "vec" as const,
      };
    });

    return finalResults;
  };

  // Execute search based on current mode and query
  const executeSearch = async (collectionName?: string | null): Promise<void> => {
    const currentQuery = query().trim();
    if (!currentQuery) {
      batch(() => {
        setResults([]);
        setError(null);
      });
      return;
    }

    batch(() => {
      setIsLoading(true);
      setError(null);
    });

    try {
      const store = await getStore();
      const currentMode = mode();
      const limit = settings().resultsPerPage;

      let searchResults: SearchResult[] = [];

      switch (currentMode) {
        case "search":
          searchResults = await executeFTS(store, currentQuery, limit, collectionName);
          break;
        case "vsearch":
          searchResults = await executeVector(store, currentQuery, limit, collectionName);
          break;
        case "query":
          searchResults = await executeHybrid(store, currentQuery, limit, collectionName);
          break;
      }

      batch(() => {
        setResults(searchResults);
        setIsLoading(false);
      });
    } catch (err) {
      batch(() => {
        setError(err instanceof Error ? err.message : "Search failed");
        setIsLoading(false);
      });
    }
  };

  // Setters
  const setQuery = (newQuery: string): void => {
    setQuerySignal(newQuery);
  };

  const setMode = (newMode: SearchMode): void => {
    setModeSignal(newMode);
  };

  const cycleMode = (): void => {
    const currentIdx = mode();
    const modes: SearchMode[] = ["search", "vsearch", "query"];
    const currentIndex = modes.indexOf(currentIdx);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    if (nextMode) {
      setModeSignal(nextMode);
    }
  };

  return {
    query,
    setQuery,
    mode,
    setMode,
    cycleMode,
    results,
    isLoading,
    error,
    executeSearch,
  };
}
