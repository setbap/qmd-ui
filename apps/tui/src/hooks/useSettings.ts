/**
 * useSettings hook - Manages TUI settings with persistence
 * SolidJS reactive hook for settings state
 */

import { createSignal, createEffect, createMemo } from "solid-js";
import type { TUISettings, OutputFormat } from "../types/tui.js";
import { DEFAULT_SETTINGS } from "../types/tui.js";
import { loadSettings, saveSettings, mergeSettings } from "../utils/config.js";

export interface UseSettingsReturn {
  readonly settings: () => TUISettings;
  readonly updateSettings: (partial: Partial<TUISettings>) => void;
  readonly resetSettings: () => void;
  readonly outputFormat: () => OutputFormat;
  readonly resultsPerPage: () => number;
  readonly autoEmbed: () => boolean;
  readonly debounceMs: () => number;
}

/**
 * Create a reactive settings hook with auto-persistence
 * Settings are loaded on mount and saved on every change
 */
export function useSettings(): UseSettingsReturn {
  // Initialize with loaded settings or defaults
  const [settings, setSettings] = createSignal<TUISettings>(loadSettings());

  // Auto-save effect - persists to disk on every change
  createEffect(() => {
    const current = settings();
    try {
      saveSettings(current);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  });

  // Update partial settings
  const updateSettings = (partial: Partial<TUISettings>): void => {
    setSettings((current) => mergeSettings(current, partial));
  };

  // Reset to defaults
  const resetSettings = (): void => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Memoized getters for individual settings
  const outputFormat = createMemo(() => settings().outputFormat);
  const resultsPerPage = createMemo(() => settings().resultsPerPage);
  const autoEmbed = createMemo(() => settings().autoEmbed);
  const debounceMs = createMemo(() => settings().debounceMs);

  return {
    settings,
    updateSettings,
    resetSettings,
    outputFormat,
    resultsPerPage,
    autoEmbed,
    debounceMs,
  };
}
