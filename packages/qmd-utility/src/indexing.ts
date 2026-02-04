/**
 * Indexing module - shared collection indexing functionality
 * Used by CLI, Web, and TUI applications
 */

import type { Database } from "bun:sqlite";
import {
  hashContent,
  extractTitle,
  findActiveDocument,
  updateDocumentTitle,
  insertContent,
  updateDocument,
  insertDocument,
  getActiveDocumentPaths,
  deactivateDocument,
  cleanupOrphanedContent,
  getHashesNeedingEmbedding,
  getRealPath,
  resolve,
  handelize,
  clearCache,
} from "@qmd/core";

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  indexed: number;
  updated: number;
  unchanged: number;
  percentComplete: number;
  etaSeconds?: number;
}

export interface IndexingResult {
  totalFiles: number;
  indexed: number;
  updated: number;
  unchanged: number;
  removed: number;
  orphanedHashes: number;
  needsEmbedding: number;
}

export type IndexingProgressCallback = (
  progress: IndexingProgress,
) => void | Promise<void>;

export interface IndexingOptions {
  db: Database;
  path: string;
  pattern?: string;
  collectionName: string;
  onProgress?: IndexingProgressCallback;
  signal?: AbortSignal;
  suppressEmbedNotice?: boolean;
}

const EXCLUDE_DIRS = [
  "node_modules",
  ".git",
  ".cache",
  "vendor",
  "dist",
  "build",
];

export async function indexCollection(
  options: IndexingOptions,
): Promise<IndexingResult> {
  const {
    db,
    path,
    pattern = "**/*.md",
    collectionName,
    onProgress,
    signal,
    suppressEmbedNotice = false,
  } = options;

  const resolvedPath = getRealPath(path);
  const now = new Date().toISOString();

  clearCache(db);

  const glob = new Bun.Glob(pattern);
  const files: string[] = [];

  for await (const file of glob.scan({
    cwd: resolvedPath,
    onlyFiles: true,
    followSymlinks: true,
  })) {
    const parts = file.split("/");
    const shouldSkip = parts.some(
      (part) =>
        part === "node_modules" ||
        part.startsWith(".") ||
        EXCLUDE_DIRS.includes(part),
    );
    if (!shouldSkip) {
      files.push(file);
    }

    if (signal?.aborted) {
      throw new Error("Indexing cancelled");
    }
  }

  const totalFiles = files.length;

  let indexed = 0;
  let updated = 0;
  let unchanged = 0;
  let processed = 0;
  const seenPaths = new Set<string>();
  const startTime = Date.now();

  for (const relativeFile of files) {
    if (signal?.aborted) {
      throw new Error("Indexing cancelled");
    }

    const filepath = getRealPath(resolve(resolvedPath, relativeFile));
    const normalizedPath = handelize(relativeFile);
    seenPaths.add(normalizedPath);

    if (onProgress) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed || 1;
      const remaining = (totalFiles - processed) / rate;

      await onProgress({
        totalFiles,
        processedFiles: processed,
        currentFile: relativeFile,
        indexed,
        updated,
        unchanged,
        percentComplete: Math.round((processed / totalFiles) * 100),
        etaSeconds: processed > 2 ? Math.round(remaining) : undefined,
      });
    }

    try {
      const content = await Bun.file(filepath).text();

      if (!content.trim()) {
        processed++;
        continue;
      }

      const hash = await hashContent(content);
      const title = extractTitle(content, relativeFile);

      const existing = findActiveDocument(db, collectionName, normalizedPath);

      if (existing) {
        if (existing.hash === hash) {
          if (existing.title !== title) {
            updateDocumentTitle(db, existing.id, title, now);
            updated++;
          } else {
            unchanged++;
          }
        } else {
          insertContent(db, hash, content, now);
          const stat = await Bun.file(filepath).stat();
          updateDocument(
            db,
            existing.id,
            title,
            hash,
            stat ? new Date(stat.mtime).toISOString() : now,
          );
          updated++;
        }
      } else {
        indexed++;
        insertContent(db, hash, content, now);
        const stat = await Bun.file(filepath).stat();
        insertDocument(
          db,
          collectionName,
          normalizedPath,
          title,
          hash,
          stat ? new Date(stat.birthtime).toISOString() : now,
          stat ? new Date(stat.mtime).toISOString() : now,
        );
      }
    } catch (err) {
      console.error(`Error processing file ${relativeFile}:`, err);
      throw err;
    }

    processed++;
  }

  if (onProgress) {
    await onProgress({
      totalFiles,
      processedFiles: processed,
      indexed,
      updated,
      unchanged,
      percentComplete: 100,
      etaSeconds: 0,
    });
  }

  const allActive = getActiveDocumentPaths(db, collectionName);
  let removed = 0;
  for (const path of allActive) {
    if (!seenPaths.has(path)) {
      deactivateDocument(db, collectionName, path);
      removed++;
    }
  }

  const orphanedHashes = cleanupOrphanedContent(db);
  const needsEmbedding = getHashesNeedingEmbedding(db);

  return {
    totalFiles,
    indexed,
    updated,
    unchanged,
    removed,
    orphanedHashes,
    needsEmbedding,
  };
}

export function formatIndexingETA(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function renderProgressBar(percent: number, width: number = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
