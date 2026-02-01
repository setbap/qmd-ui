/**
 * Document utility functions - shared across CLI, Web, and TUI
 */

import { Database } from "bun:sqlite";
import {
  isDocid,
  findDocumentByDocid,
  isVirtualPath,
  parseVirtualPath,
  buildVirtualPath,
  getContextForPath,
  getPwd,
  resolve,
  homedir,
  getRealPath,
  listCollections as yamlListCollections,
  type NamedCollection,
} from "@qmd/core";

export interface DocumentResult {
  content: string;
  filepath: string;
  virtualPath: string;
  collectionName: string;
  context: string | null;
}

/**
 * Detect which collection (if any) contains the given filesystem path.
 * Returns { collectionName, relativePath } or null if not in any collection.
 */
function detectCollectionFromPath(
  fsPath: string,
  collections: NamedCollection[]
): { collectionName: string; relativePath: string } | null {
  const realPath = getRealPath(fsPath);

  // Find longest matching path
  let bestMatch: { name: string; path: string } | null = null;
  for (const coll of collections) {
    if (realPath.startsWith(coll.path + "/") || realPath === coll.path) {
      if (!bestMatch || coll.path.length > bestMatch.path.length) {
        bestMatch = { name: coll.name, path: coll.path };
      }
    }
  }

  if (!bestMatch) return null;

  // Calculate relative path
  let relativePath = realPath;
  if (relativePath.startsWith(bestMatch.path + "/")) {
    relativePath = relativePath.slice(bestMatch.path.length + 1);
  } else if (relativePath === bestMatch.path) {
    relativePath = "";
  }

  return {
    collectionName: bestMatch.name,
    relativePath,
  };
}

/**
 * Get document content by path (virtual, filesystem, or collection/path format).
 * Returns document data for programmatic use.
 * This is the core logic extracted from the CLI getDocument function.
 */
export function fetchDocument(
  db: Database,
  filename: string,
  collections?: NamedCollection[]
): DocumentResult {
  // Handle docid lookup (#abc123, abc123, "#abc123", "abc123", etc.)
  let inputPath = filename;
  if (isDocid(inputPath)) {
    const docidMatch = findDocumentByDocid(db, inputPath);
    if (docidMatch) {
      inputPath = docidMatch.filepath;
    } else {
      throw new Error(`Document not found: ${filename}`);
    }
  }

  let doc: { collectionName: string; path: string; body: string } | null = null;
  let virtualPath: string;

  // Handle virtual paths (qmd://collection/path)
  if (isVirtualPath(inputPath)) {
    const parsed = parseVirtualPath(inputPath);
    if (!parsed) {
      throw new Error(`Invalid virtual path: ${inputPath}`);
    }

    // Try exact match on collection + path
    doc = db
      .prepare(
        `
      SELECT d.collection as collectionName, d.path, content.doc as body
      FROM documents d
      JOIN content ON content.hash = d.hash
      WHERE d.collection = ? AND d.path = ? AND d.active = 1
    `
      )
      .get(parsed.collectionName, parsed.path) as typeof doc;

    if (!doc) {
      // Try fuzzy match by path ending
      doc = db
        .prepare(
          `
        SELECT d.collection as collectionName, d.path, content.doc as body
        FROM documents d
        JOIN content ON content.hash = d.hash
        WHERE d.collection = ? AND d.path LIKE ? AND d.active = 1
        LIMIT 1
      `
        )
        .get(parsed.collectionName, `%${parsed.path}`) as typeof doc;
    }

    virtualPath = inputPath;
  } else {
    // Try to interpret as collection/path format first
    if (!inputPath.startsWith("/") && !inputPath.startsWith("~")) {
      const parts = inputPath.split("/");
      if (parts.length >= 2) {
        const possibleCollection = parts[0];
        const possiblePath = parts.slice(1).join("/");

        // Check if this collection exists
        const collExists = possibleCollection
          ? db
              .prepare(
                `
          SELECT 1 FROM documents WHERE collection = ? AND active = 1 LIMIT 1
        `
              )
              .get(possibleCollection)
          : null;

        if (collExists) {
          // Try exact match on collection + path
          doc = db
            .prepare(
              `
            SELECT d.collection as collectionName, d.path, content.doc as body
            FROM documents d
            JOIN content ON content.hash = d.hash
            WHERE d.collection = ? AND d.path = ? AND d.active = 1
          `
            )
            .get(possibleCollection || "", possiblePath || "") as {
            collectionName: string;
            path: string;
            body: string;
          } | null;

          if (!doc) {
            // Try fuzzy match by path ending
            doc = db
              .prepare(
                `
              SELECT d.collection as collectionName, d.path, content.doc as body
              FROM documents d
              JOIN content ON content.hash = d.hash
              WHERE d.collection = ? AND d.path LIKE ? AND d.active = 1
              LIMIT 1
            `
              )
              .get(possibleCollection || "", `%${possiblePath}`) as {
              collectionName: string;
              path: string;
              body: string;
            } | null;
          }

          if (doc) {
            virtualPath = buildVirtualPath(doc.collectionName, doc.path);
          }
        }
      }
    }

    // If not found as collection/path, handle as filesystem paths
    if (!doc) {
      let fsPath = inputPath;

      // Expand ~ to home directory
      if (fsPath.startsWith("~/")) {
        fsPath = homedir() + fsPath.slice(1);
      } else if (!fsPath.startsWith("/")) {
        // Relative path - resolve from current directory
        fsPath = resolve(getPwd(), fsPath);
      }
      fsPath = getRealPath(fsPath);

      // Try to detect which collection contains this path
      const allCollections = collections || yamlListCollections();
      const detected = detectCollectionFromPath(fsPath, allCollections);

      if (detected) {
        // Found collection - query by collection name + relative path
        doc = db
          .prepare(
            `
          SELECT d.collection as collectionName, d.path, content.doc as body
          FROM documents d
          JOIN content ON content.hash = d.hash
          WHERE d.collection = ? AND d.path = ? AND d.active = 1
        `
          )
          .get(detected.collectionName, detected.relativePath) as {
          collectionName: string;
          path: string;
          body: string;
        } | null;
      }

      // Fuzzy match by filename (last component of path)
      if (!doc) {
        const filenameOnly = inputPath.split("/").pop() || inputPath;
        doc = db
          .prepare(
            `
          SELECT d.collection as collectionName, d.path, content.doc as body
          FROM documents d
          JOIN content ON content.hash = d.hash
          WHERE d.path LIKE ? AND d.active = 1
          LIMIT 1
        `
          )
          .get(`%${filenameOnly}`) as {
          collectionName: string;
          path: string;
          body: string;
        } | null;
      }

      if (doc) {
        virtualPath = buildVirtualPath(doc.collectionName, doc.path);
      } else {
        virtualPath = inputPath;
      }
    }
  }

  // Ensure doc is not null before proceeding
  if (!doc) {
    throw new Error(`Document not found: ${filename}`);
  }

  // Get context for this file
  const context = getContextForPath(db, doc.collectionName, doc.path);

  return {
    content: doc.body,
    filepath: doc.path,
    virtualPath: virtualPath!,
    collectionName: doc.collectionName,
    context,
  };
}
