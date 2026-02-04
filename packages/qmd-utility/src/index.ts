/**
 * @qmd/utility - Shared utility functions for QMD
 *
 * This package provides utility functions that can be used across
 * CLI, Web, and TUI applications.
 */

// Document operations
export { fetchDocument, type DocumentResult } from "./document.js";

// Indexing operations
export {
  indexCollection,
  formatIndexingETA,
  renderProgressBar,
  type IndexingProgress,
  type IndexingResult,
  type IndexingOptions,
  type IndexingProgressCallback,
} from "./indexing.js";
