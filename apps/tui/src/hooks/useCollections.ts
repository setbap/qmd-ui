/**
 * useCollections hook - Manages collection data and operations
 * SolidJS reactive hook for collection state with CRUD operations
 */

import { createSignal, createResource, createMemo, batch } from "solid-js";
import type { NamedCollection } from "@qmd/core";
import {
  listCollections,
  addCollection,
  removeCollectionConfig,
  renameCollectionConfig,
} from "@qmd/core";

export interface UseCollectionsReturn {
  readonly collections: () => readonly NamedCollection[] | undefined;
  readonly isLoading: () => boolean;
  readonly error: () => Error | undefined;
  readonly refetch: () => void;
  readonly selectedCollection: () => string | null;
  readonly selectCollection: (name: string | null) => void;
  readonly expandedCollections: () => ReadonlySet<string>;
  readonly toggleExpand: (name: string) => void;
  readonly createCollection: (name: string, path: string, pattern?: string) => Promise<void>;
  readonly deleteCollection: (name: string) => Promise<void>;
  readonly renameCollection: (oldName: string, newName: string) => Promise<void>;
  readonly getCollectionByName: (name: string) => NamedCollection | undefined;
}

/**
 * Fetcher function for createResource
 */
async function fetchCollections(): Promise<readonly NamedCollection[]> {
  return listCollections();
}

/**
 * Create a reactive collections hook with CRUD operations
 */
export function useCollections(): UseCollectionsReturn {
  // Use createResource for async data fetching
  const [collectionsResource, { refetch }] = createResource(fetchCollections);

  // UI state signals
  const [selectedCollection, setSelectedCollection] = createSignal<string | null>(null);
  const [expandedCollections, setExpandedCollections] = createSignal<Set<string>>(new Set());

  // Computed states
  const collections = createMemo(() => collectionsResource());
  const isLoading = createMemo(() => collectionsResource.loading);
  const error = createMemo(() => collectionsResource.error);

  // Select a collection
  const selectCollection = (name: string | null): void => {
    setSelectedCollection(name);
  };

  // Toggle collection expansion
  const toggleExpand = (name: string): void => {
    setExpandedCollections((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Create a new collection
  const createCollection = async (
    name: string,
    path: string,
    pattern?: string
  ): Promise<void> => {
    try {
      addCollection(name, path, pattern ?? "**/*.md");
      await refetch();
    } catch (err) {
      console.error("Failed to create collection:", err);
      throw err;
    }
  };

  // Delete a collection
  const deleteCollection = async (name: string): Promise<void> => {
    try {
      removeCollectionConfig(name);
      
      batch(() => {
        // Clear selection if deleted collection was selected
        if (selectedCollection() === name) {
          setSelectedCollection(null);
        }
        // Remove from expanded set
        setExpandedCollections((current) => {
          const next = new Set(current);
          next.delete(name);
          return next;
        });
      });
      
      await refetch();
    } catch (err) {
      console.error("Failed to delete collection:", err);
      throw err;
    }
  };

  // Rename a collection
  const renameCollection = async (oldName: string, newName: string): Promise<void> => {
    try {
      renameCollectionConfig(oldName, newName);
      
      batch(() => {
        // Update selection if renamed collection was selected
        if (selectedCollection() === oldName) {
          setSelectedCollection(newName);
        }
        // Update expanded set
        setExpandedCollections((current) => {
          const next = new Set(current);
          if (next.has(oldName)) {
            next.delete(oldName);
            next.add(newName);
          }
          return next;
        });
      });
      
      await refetch();
    } catch (err) {
      console.error("Failed to rename collection:", err);
      throw err;
    }
  };

  // Get collection by name helper
  const getCollectionByName = (name: string): NamedCollection | undefined => {
    return collections()?.find((c) => c.name === name);
  };

  return {
    collections,
    isLoading,
    error,
    refetch,
    selectedCollection,
    selectCollection,
    expandedCollections,
    toggleExpand,
    createCollection,
    deleteCollection,
    renameCollection,
    getCollectionByName,
  };
}
