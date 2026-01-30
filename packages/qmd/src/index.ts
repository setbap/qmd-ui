/**
 * @qmd/core - Core QMD library
 * 
 * This package provides the core functionality for Quick Markdown Search:
 * - Database operations and search (store)
 * - LLM embeddings and reranking (llm)
 * - Collection configuration management (collections)
 */

// Store exports
export {
  createStore,
  type Store,
  type DocumentResult,
  type DocumentNotFound,
  type SearchResult,
  type RankedResult,
  type MultiGetResult,
  type CollectionInfo,
  type IndexStatus,
  type IndexHealthInfo,
  type VirtualPath,
  // Path utilities
  homedir,
  isAbsolutePath,
  normalizePathSeparators,
  getRelativePathFromPrefix,
  resolve,
  getPwd,
  getRealPath,
  // Production mode
  enableProductionMode,
  getDefaultDbPath,
  // Virtual paths
  normalizeVirtualPath,
  parseVirtualPath,
  buildVirtualPath,
  isVirtualPath,
  // Document helpers
  hashContent,
  extractTitle,
  chunkDocument,
  chunkDocumentByTokens,
  handelize,
  getDocid,
  normalizeDocid,
  isDocid,
  // Search
  searchFTS,
  searchVec,
  reciprocalRankFusion,
  extractSnippet,
  // Context (low-level)
  getContextForFile,
  getContextForPath,
  getCollectionByName,
  getCollectionsWithoutContext,
  getTopLevelPathsWithoutContext,
  // Virtual path resolution
  resolveVirtualPath,
  toVirtualPath,
  // Document operations
  insertContent,
  insertDocument,
  findActiveDocument,
  updateDocumentTitle,
  updateDocument,
  deactivateDocument,
  getActiveDocumentPaths,
  // Fuzzy matching
  findSimilarFiles,
  findDocumentByDocid,
  matchFilesByGlob,
  // Embedding operations
  getHashesNeedingEmbedding,
  getHashesForEmbedding,
  clearAllEmbeddings,
  insertEmbedding,
  // Status and health
  getStatus,
  getIndexHealth,
  // Caching
  clearCache,
  getCacheKey,
  getCachedResult,
  setCachedResult,
  // Cleanup
  cleanupOrphanedContent,
  deleteLLMCache,
  deleteInactiveDocuments,
  cleanupOrphanedVectors,
  vacuumDatabase,
  // Database operations
  listCollections as listCollectionsFromDB,
  removeCollection,
  renameCollection,
  // Constants
  DEFAULT_EMBED_MODEL,
  DEFAULT_RERANK_MODEL,
  DEFAULT_QUERY_MODEL,
  DEFAULT_GLOB,
  DEFAULT_MULTI_GET_MAX_BYTES,
  CHUNK_SIZE_TOKENS,
  CHUNK_OVERLAP_TOKENS,
  CHUNK_SIZE_CHARS,
  CHUNK_OVERLAP_CHARS,
} from "./store.js";

// LLM exports
export {
  LlamaCpp,
  getDefaultLlamaCpp,
  setDefaultLlamaCpp,
  disposeDefaultLlamaCpp,
  formatQueryForEmbedding,
  formatDocForEmbedding,
  type LLM,
  type EmbedOptions,
  type GenerateOptions,
  type RerankOptions,
  type EmbeddingResult,
  type GenerateResult,
  type RerankResult,
  type RerankDocumentResult,
  type RerankDocument,
  type TokenLogProb,
  type ModelInfo,
  type QueryType,
  type Queryable,
  type LlamaCppConfig,
} from "./llm.js";

// Collections exports
export {
  loadConfig,
  saveConfig,
  getCollection,
  listCollections,
  addCollection,
  removeCollection as removeCollectionConfig,
  renameCollection as renameCollectionConfig,
  getGlobalContext,
  setGlobalContext,
  getContexts,
  addContext,
  removeContext,
  listAllContexts,
  findContextForPath as findContextForPathConfig,
  getConfigPath,
  configExists,
  isValidCollectionName,
  type Collection,
  type CollectionConfig,
  type ContextMap,
  type NamedCollection,
} from "./collections.js";
