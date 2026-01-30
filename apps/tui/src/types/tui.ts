/**
 * TUI-specific types for QMD Terminal User Interface
 * Following Matt Pocock's strict typing philosophy
 */

import type { SearchResult, NamedCollection } from "@qmd/core";

// =============================================================================
// Search Mode Types
// =============================================================================

export const SEARCH_MODES = ["search", "vsearch", "query"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

// =============================================================================
// Settings Types
// =============================================================================

export const OUTPUT_FORMATS = [
  "cli",
  "json",
  "csv",
  "md",
  "xml",
  "files",
] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface FormatOption {
  readonly name: string;
  readonly value: OutputFormat;
  readonly description: string;
}

export interface TUISettings {
  readonly outputFormat: OutputFormat;
  readonly resultsPerPage: number;
  readonly autoEmbed: boolean;
  readonly debounceMs: number;
}

export const DEFAULT_SETTINGS: TUISettings = {
  outputFormat: "cli",
  resultsPerPage: 20,
  autoEmbed: false,
  debounceMs: 0, // 0 means no auto-search, only on Enter
} as const;

// =============================================================================
// Theme Types (Dark Gray Theme)
// =============================================================================

export interface ThemeColors {
  readonly bg: string;
  readonly bgSecondary: string;
  readonly fg: string;
  readonly accent: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly border: string;
}

export const DEFAULT_THEME: ThemeColors = {
  bg: "#1a1a1a", // Dark background
  bgSecondary: "#252525", // Secondary dark
  fg: "#cccccc", // Light gray text
  accent: "#6b6b6b", // Gray accent (not blue!)
  success: "#4caf50", // Green
  warning: "#ff9800", // Orange
  error: "#f44336", // Red
  border: "#3d3d3d", // Gray border
} as const;

// =============================================================================
// Search State Types
// =============================================================================

export interface SearchState {
  readonly query: string;
  readonly mode: SearchMode;
  readonly results: readonly SearchResult[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export type SearchAction =
  | { readonly type: "SET_QUERY"; readonly payload: string }
  | { readonly type: "SET_MODE"; readonly payload: SearchMode }
  | { readonly type: "SET_RESULTS"; readonly payload: readonly SearchResult[] }
  | { readonly type: "SET_LOADING"; readonly payload: boolean }
  | { readonly type: "SET_ERROR"; readonly payload: string | null }
  | { readonly type: "CYCLE_MODE" };

// =============================================================================
// Collection State Types
// =============================================================================

export interface CollectionState {
  readonly collections: readonly NamedCollection[];
  readonly selectedCollection: string | null;
  readonly expandedCollections: ReadonlySet<string>;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export type CollectionAction =
  | {
      readonly type: "SET_COLLECTIONS";
      readonly payload: readonly NamedCollection[];
    }
  | { readonly type: "SELECT_COLLECTION"; readonly payload: string | null }
  | { readonly type: "TOGGLE_EXPAND"; readonly payload: string }
  | { readonly type: "SET_LOADING"; readonly payload: boolean }
  | { readonly type: "SET_ERROR"; readonly payload: string | null };

// =============================================================================
// Modal Types
// =============================================================================

export type ModalType =
  | "commandPalette"
  | "createCollection"
  | "settings"
  | null;

export interface ModalState {
  readonly activeModal: ModalType;
}

// =============================================================================
// Command Palette Action Types
// =============================================================================

export const COMMAND_ACTIONS = [
  "embed",
  "createCollection",
  "changeSearchMode",
  "settings",
  "quit",
] as const;

export type CommandAction = (typeof COMMAND_ACTIONS)[number];

export interface CommandOption {
  readonly name: string;
  readonly description: string;
  readonly action: CommandAction;
  readonly shortcut?: string;
}

export const COMMAND_OPTIONS: readonly CommandOption[] = [
  {
    name: "Embed",
    description: "Generate embeddings for collections",
    action: "embed",
    shortcut: "Ctrl+E",
  },
  {
    name: "Create Collection",
    description: "Add a new collection with path and mask",
    action: "createCollection",
  },
  {
    name: "Change Search Mode",
    description: "Toggle between search/vsearch/query",
    action: "changeSearchMode",
    shortcut: "Tab",
  },
  {
    name: "Settings",
    description: "Configure TUI preferences",
    action: "settings",
    shortcut: "Ctrl+S",
  },
  {
    name: "Quit",
    description: "Exit QMD TUI",
    action: "quit",
    shortcut: "Ctrl+C",
  },
] as const;

// =============================================================================
// Component Props Types
// =============================================================================

export interface SearchInputProps {
  readonly value: string;
  readonly onInput: (value: string) => void;
  readonly onSubmit: () => void;
  readonly placeholder?: string;
  readonly focused?: boolean;
}

export interface CollectionPanelProps {
  readonly onSelectCollection: (name: string) => void;
  readonly onUpdateCollection: (name: string) => void;
  readonly onDeleteCollection: (name: string) => void;
}

export interface SearchResultsProps {
  readonly results: readonly SearchResult[];
  readonly query: string;
  readonly format: OutputFormat;
  readonly onSelectResult: (result: SearchResult) => void;
}

export interface SearchModeIndicatorProps {
  readonly mode: SearchMode;
  readonly onChange: (mode: SearchMode) => void;
}

export interface CommandPaletteProps {
  readonly onAction: (action: CommandAction) => void;
  readonly onClose: () => void;
}

export interface CreateCollectionModalProps {
  readonly onCreate: (name: string, path: string, pattern: string) => void;
  readonly onClose: () => void;
}

export interface SettingsModalProps {
  readonly settings: TUISettings;
  readonly onUpdate: (settings: Partial<TUISettings>) => void;
  readonly onClose: () => void;
}

// =============================================================================
// File Tree Types
// =============================================================================

export interface FileNode {
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly children?: readonly FileNode[];
}
