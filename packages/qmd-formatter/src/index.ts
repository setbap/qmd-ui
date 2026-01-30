/**
 * @qmd/formatter - QMD Output Formatting Library
 * 
 * Provides methods to format search results and documents into various output formats:
 * JSON, CSV, XML, Markdown, files list, and CLI (colored terminal output).
 */

export {
  // Main format functions
  formatSearchResults,
  formatDocuments,
  formatDocument,
  
  // Search result formatters
  searchResultsToJson,
  searchResultsToCsv,
  searchResultsToFiles,
  searchResultsToMarkdown,
  searchResultsToXml,
  searchResultsToMcpCsv,
  
  // Document formatters
  documentsToJson,
  documentsToCsv,
  documentsToFiles,
  documentsToMarkdown,
  documentsToXml,
  documentToJson,
  documentToMarkdown,
  documentToXml,
  
  // Utility functions
  addLineNumbers,
  getDocid,
  escapeCSV,
  escapeXml,
  
  // Types
  type MultiGetFile,
  type OutputFormat,
  type FormatOptions,
} from "./formatter.js";

// Re-export types from core for convenience
export type { SearchResult, MultiGetResult, DocumentResult } from "@qmd/core";
