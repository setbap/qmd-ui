/**
 * QMD Server Functions - API layer for web app
 * Wraps @qmd/core functionality for TanStack Start server functions
 */

import { createServerFn } from '@tanstack/react-start'
import {
  createStore,
  listCollections,
  getActiveDocumentPaths,
  searchFTS,
  searchVec,
  reciprocalRankFusion,
  getContextForFile,
  DEFAULT_EMBED_MODEL,
  addCollection,
  removeCollection,
  renameCollection,
  loadConfig,
  saveConfig,
  getStatus,
  clearCache,
  type SearchResult,
  type RankedResult,
} from '@qmd/core'

// Enable production mode for QMD
import { execSync } from 'child_process'

// =============================================================================
// Types
// =============================================================================

export type SearchMode = 'search' | 'vsearch' | 'query'

export interface SearchParams {
  query: string
  mode: SearchMode
  collection?: string | null
  limit?: number
}

export interface FileContent {
  content: string
  filepath: string
  displayPath: string
  title: string
}

export interface AppSettings {
  globalContext?: string
  outputFormat: 'text' | 'json' | 'markdown'
  resultsPerPage: number
}

// =============================================================================
// Store Instance (singleton pattern for server)
// =============================================================================

let storeInstance: Awaited<ReturnType<typeof createStore>> | null = null

async function getStore() {
  if (!storeInstance) {
    storeInstance = createStore()
  }
  return storeInstance
}

// =============================================================================
// Collection Operations
// =============================================================================

export const getCollections = createServerFn().handler(async () => {
  return listCollections()
})

export const getCollectionFiles = createServerFn()
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const { name } = data
    if (!name) throw new Error('Collection name required')

    try {
      console.clear()
      console.log('gooo')
      const store = await getStore()
      const d = getActiveDocumentPaths(store.db, name)
      console.log({ d })

      return d
    } catch (error) {
      console.log(error)
      return []
    }
  })

export const createCollection = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as {
    name: string
    path: string
    pattern?: string
  }
  const { name, path, pattern = '**/*.md' } = data
  addCollection(name, path, pattern)
  return { success: true, name }
})

export const deleteCollection = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as { name: string }
  const { name } = data
  const store = await getStore()

  // Remove from database
  const result = removeCollection(store.db, name)

  return { success: true, name, ...result }
})

export const renameCollectionFn = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as { oldName: string; newName: string }
  const { oldName, newName } = data
  const store = await getStore()

  // Rename in database
  renameCollection(store.db, oldName, newName)

  return { success: true, oldName, newName }
})

export const updateCollection = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as { name: string }
  const { name } = data

  // Run qmd update command
  try {
    execSync(`qmd update --collection ${name}`, {
      encoding: 'utf-8',
      timeout: 60000,
    })
    return { success: true, name, message: 'Collection updated successfully' }
  } catch (error) {
    throw new Error(`Failed to update collection: ${error}`)
  }
})

export const embedCollection = createServerFn().handler(async () => {
  // Run qmd embed command
  try {
    execSync('qmd embed', {
      encoding: 'utf-8',
      timeout: 300000, // 5 minutes
    })
    return { success: true, message: 'Embeddings generated successfully' }
  } catch (error) {
    throw new Error(`Failed to generate embeddings: ${error}`)
  }
})

// =============================================================================
// Search Operations
// =============================================================================

export const search = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as SearchParams
  const { query, mode, collection, limit = 20 } = data

  if (!query.trim()) {
    return []
  }

  const store = await getStore()

  switch (mode) {
    case 'search':
      return executeFTS(store.db, query, limit, collection)
    case 'vsearch':
      return executeVector(store.db, query, limit, collection)
    case 'query':
      return executeHybrid(store.db, query, limit, collection)
    default:
      throw new Error(`Unknown search mode: ${mode}`)
  }
})

async function executeFTS(
  db: any,
  query: string,
  limit: number,
  collectionName?: string | null,
): Promise<SearchResult[]> {
  const fetchLimit = Math.max(50, limit * 2)
  const ftsResults = searchFTS(
    db,
    query,
    fetchLimit,
    (collectionName || '') as any,
  )

  return ftsResults.slice(0, limit).map((r: SearchResult) => ({
    ...r,
    context: getContextForFile(db, r.filepath),
  }))
}

async function executeVector(
  db: any,
  query: string,
  limit: number,
  collectionName?: string | null,
): Promise<SearchResult[]> {
  // Check if vectors table exists
  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='vectors_vec'`,
    )
    .get()

  if (!tableExists) {
    throw new Error(
      "Vector index not found. Run 'qmd embed' first to create embeddings.",
    )
  }

  const vecResults = await searchVec(
    db,
    query,
    DEFAULT_EMBED_MODEL,
    limit,
    (collectionName || '') as any,
  )

  return vecResults.map((r: SearchResult) => ({
    ...r,
    context: getContextForFile(db, r.filepath),
  }))
}

async function executeHybrid(
  db: any,
  query: string,
  limit: number,
  collectionName?: string | null,
): Promise<SearchResult[]> {
  // Check if vectors table exists
  const hasVectors = !!db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='vectors_vec'`,
    )
    .get()

  // Run initial FTS search
  const initialFts = searchFTS(db, query, 20, (collectionName || '') as any)

  // Check for strong signal
  const topScore = initialFts[0]?.score ?? 0
  const secondScore = initialFts[1]?.score ?? 0
  const hasStrongSignal =
    initialFts.length > 0 && topScore >= 0.85 && topScore - secondScore >= 0.15

  // If strong signal, return FTS results directly
  if (hasStrongSignal) {
    return initialFts.slice(0, limit).map((r: SearchResult) => ({
      ...r,
      context: getContextForFile(db, r.filepath),
    }))
  }

  // Otherwise, do hybrid search with RRF fusion
  const rankedLists: RankedResult[][] = []

  if (initialFts.length > 0) {
    rankedLists.push(
      initialFts.map((r: SearchResult) => ({
        file: r.filepath,
        displayPath: r.displayPath,
        title: r.title,
        body: r.body || '',
        score: r.score,
      })),
    )
  }

  if (hasVectors) {
    const vecResults = await searchVec(
      db,
      query,
      DEFAULT_EMBED_MODEL,
      20,
      (collectionName || '') as any,
    )

    if (vecResults.length > 0) {
      rankedLists.push(
        vecResults.map((r: SearchResult) => ({
          file: r.filepath,
          displayPath: r.displayPath,
          title: r.title,
          body: r.body || '',
          score: r.score,
        })),
      )
    }
  }

  if (rankedLists.length === 0) {
    return []
  }

  const fused = reciprocalRankFusion(rankedLists)

  return fused.slice(0, limit).map((fused: RankedResult) => {
    const originalFts = initialFts.find(
      (r: SearchResult) => r.filepath === fused.file,
    )

    if (originalFts) {
      return {
        ...originalFts,
        score: fused.score,
        context: getContextForFile(db, fused.file),
      }
    }

    return {
      filepath: fused.file,
      displayPath: fused.displayPath,
      title: fused.title,
      body: fused.body,
      score: fused.score,
      context: getContextForFile(db, fused.file),
      hash: '',
      docid: '',
      collectionName: '',
      modifiedAt: '',
      bodyLength: 0,
      source: 'vec' as const,
    }
  })
}

// =============================================================================
// File Operations
// =============================================================================

export const getFileContent = createServerFn().handler(async (ctx) => {
  // Access request from context
  const request = (ctx as any).request
  if (!request) throw new Error('Request not available')

  const url = new URL(request.url)
  const path = url.searchParams.get('path')
  if (!path) throw new Error('File path required')

  const store = await getStore()

  // Query for document by virtual path
  const collectionName = url.searchParams.get('collection') || undefined
  let result: {
    id: number
    path: string
    title: string
    collection_name: string
  } | null

  if (collectionName) {
    // Try virtual path format
    const virtualPath = `qmd://${collectionName}/${path}`
    result = store.db
      .prepare(
        `SELECT d.id, d.path, d.title, c.name as collection_name
         FROM documents d
         JOIN collections c ON d.collection_id = c.id
         WHERE d.path = ? AND d.active = 1
         LIMIT 1`,
      )
      .get(virtualPath) as {
      id: number
      path: string
      title: string
      collection_name: string
    } | null
  } else {
    result = null
  }

  if (!result) {
    // Try direct path match
    result = store.db
      .prepare(
        `SELECT d.id, d.path, d.title, c.name as collection_name
         FROM documents d
         JOIN collections c ON d.collection_id = c.id
         WHERE d.path = ? AND d.active = 1
         LIMIT 1`,
      )
      .get(path) as {
      id: number
      path: string
      title: string
      collection_name: string
    } | null
  }

  if (!result) {
    throw new Error(`File not found: ${path}`)
  }

  // Get content
  const contentResult = store.db
    .prepare(
      `SELECT c.body
       FROM content c
       JOIN documents d ON c.hash = d.content_hash
       WHERE d.id = ?
       LIMIT 1`,
    )
    .get(result.id) as { body: string } | null

  if (!contentResult) {
    throw new Error(`Could not read file content: ${path}`)
  }

  return {
    content: contentResult.body,
    filepath: result.path,
    displayPath: result.path,
    title: result.title,
  } as FileContent
})

// =============================================================================
// Settings Operations
// =============================================================================

export const getSettings = createServerFn().handler(async () => {
  const config = loadConfig()

  // Merge with web-specific settings
  const defaultSettings: AppSettings = {
    globalContext: config.global_context,
    outputFormat: 'text',
    resultsPerPage: 20,
  }

  return defaultSettings
})

export const updateSettings = createServerFn().handler(async (ctx) => {
  const data = ctx.data as unknown as Partial<AppSettings>
  const config = loadConfig()

  if (data.globalContext !== undefined) {
    config.global_context = data.globalContext
  }

  saveConfig(config)

  return { success: true }
})

// =============================================================================
// Status & Maintenance
// =============================================================================

export const getIndexStatus = createServerFn().handler(async () => {
  const store = await getStore()
  return getStatus(store.db)
})

export const clearIndexCache = createServerFn().handler(async () => {
  const store = await getStore()
  clearCache(store.db)
  return { success: true }
})
