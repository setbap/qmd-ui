/**
 * Configuration utilities for QMD TUI
 * Handles file paths and settings persistence
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type {
  TUISettings,
  OutputFormat,
} from "../types/tui.js";
import { DEFAULT_SETTINGS } from "../types/tui.js";

// =============================================================================
// Path Configuration
// =============================================================================

const CONFIG_DIR_NAME = "openqmd";
const TUI_SUBDIR = "tui";
const SETTINGS_FILE_NAME = "settings.json";

/**
 * Get the base configuration directory
 * Respects QMD_CONFIG_DIR environment variable for testing
 */
function getBaseConfigDir(): string {
  if (process.env.QMD_CONFIG_DIR) {
    return process.env.QMD_CONFIG_DIR;
  }
  return join(homedir(), ".config", CONFIG_DIR_NAME);
}

/**
 * Get the TUI-specific config directory
 */
export function getTUIConfigDir(): string {
  return join(getBaseConfigDir(), TUI_SUBDIR);
}

/**
 * Get the full path to settings file
 */
export function getSettingsPath(): string {
  return join(getTUIConfigDir(), SETTINGS_FILE_NAME);
}

// =============================================================================
// Settings Persistence
// =============================================================================

/**
 * Ensure the config directory exists
 */
function ensureConfigDir(): void {
  const configDir = getTUIConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Validate and parse output format
 */
function parseOutputFormat(value: unknown): OutputFormat {
  const validFormats: readonly OutputFormat[] = [
    "cli",
    "json",
    "csv",
    "md",
    "xml",
    "files",
  ];

  if (typeof value === "string" && validFormats.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }
  return DEFAULT_SETTINGS.outputFormat;
}

/**
 * Validate and parse number within bounds
 */
function parseNumber(value: unknown, defaultValue: number, min: number, max: number): number {
  if (typeof value !== "number" || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and parse boolean
 */
function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return defaultValue;
}

/**
 * Parse raw settings data with validation
 */
function parseSettings(data: unknown): TUISettings {
  if (typeof data !== "object" || data === null) {
    return DEFAULT_SETTINGS;
  }

  const raw = data as Record<string, unknown>;

  return {
    outputFormat: parseOutputFormat(raw.outputFormat),
    resultsPerPage: parseNumber(raw.resultsPerPage, DEFAULT_SETTINGS.resultsPerPage, 1, 100),
    autoEmbed: parseBoolean(raw.autoEmbed, DEFAULT_SETTINGS.autoEmbed),
    debounceMs: parseNumber(raw.debounceMs, DEFAULT_SETTINGS.debounceMs, 50, 2000),
  };
}

/**
 * Load settings from disk
 * Returns default settings if file doesn't exist or is invalid
 */
export function loadSettings(): TUISettings {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    return DEFAULT_SETTINGS;
  }

  try {
    const content = readFileSync(settingsPath, "utf-8");
    const data = JSON.parse(content);
    return parseSettings(data);
  } catch (error) {
    console.warn(`Failed to load settings from ${settingsPath}:`, error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to disk
 * Creates directories if needed
 */
export function saveSettings(settings: TUISettings): void {
  ensureConfigDir();
  const settingsPath = getSettingsPath();

  try {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed to save settings to ${settingsPath}:`, error);
    throw new Error(`Failed to save settings: ${error}`);
  }
}

// =============================================================================
// Settings Utilities
// =============================================================================

/**
 * Merge partial settings with current settings
 */
export function mergeSettings(
  current: TUISettings,
  partial: Partial<TUISettings>
): TUISettings {
  return {
    ...current,
    ...partial,
  };
}

/**
 * Check if settings file exists
 */
export function settingsExist(): boolean {
  return existsSync(getSettingsPath());
}
