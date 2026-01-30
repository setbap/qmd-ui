/**
 * SettingsModal component - Configuration panel for TUI preferences
 * SolidJS component using OpenTUI
 */

import { createSignal, createMemo } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { SettingsModalProps, FormatOption } from "../types/tui.js";
import { OUTPUT_FORMATS, DEFAULT_THEME } from "../types/tui.js";

const FORMAT_OPTIONS: FormatOption[] = [
  { name: "CLI", value: "cli", description: "Command line output" },
  { name: "JSON", value: "json", description: "JSON format" },
  { name: "CSV", value: "csv", description: "CSV format" },
  { name: "Markdown", value: "md", description: "Markdown format" },
  { name: "XML", value: "xml", description: "XML format" },
  { name: "Files", value: "files", description: "List of files only" },
];

export function SettingsModal(props: SettingsModalProps) {
  const [focusIndex, setFocusIndex] = createSignal(0);

  const currentFormatIndex = createMemo(() => {
    const idx = FORMAT_OPTIONS.findIndex(
      (f) => f.value === props.settings.outputFormat,
    );
    return idx >= 0 ? idx : 0;
  });

  const [resultsPerPage, setResultsPerPage] = createSignal(
    props.settings.resultsPerPage.toString(),
  );
  const [autoEmbed, setAutoEmbed] = createSignal(props.settings.autoEmbed);

  useKeyboard((key) => {
    if (key.name === "escape") {
      props.onClose();
      return;
    }

    if (key.name === "tab") {
      setFocusIndex((i) => (i + 1) % 3);
      return;
    }

    if (key.name === "enter" && focusIndex() === 2) {
      handleSave();
      return;
    }
  });

  const handleSave = (): void => {
    const perPage = parseInt(resultsPerPage(), 10);
    props.onUpdate({
      outputFormat:
        FORMAT_OPTIONS[focusIndex() === 0 ? 0 : currentFormatIndex()]?.value ??
        "md",
      resultsPerPage: isNaN(perPage) ? 20 : Math.max(1, Math.min(100, perPage)),
      autoEmbed: autoEmbed(),
    });
    props.onClose();
  };

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(0,0,0,0.5)"
    >
      <box
        border
        borderStyle="rounded"
        padding={2}
        width={60}
        height={16}
        backgroundColor={DEFAULT_THEME.bg}
      >
        <box flexDirection="column" gap={1}>
          <text fg={DEFAULT_THEME.accent}>Settings</text>

          {/* Output Format */}
          <box flexDirection="row" gap={1} alignItems="center">
            <text width={18}>Output Format:</text>
            <select
              options={FORMAT_OPTIONS}
              onSelect={(_idx: number, option: FormatOption) => {
                props.onUpdate({ outputFormat: option.value });
              }}
              selectedIndex={currentFormatIndex()}
              focused={focusIndex() === 0}
              height={6}
            />
          </box>

          {/* Results Per Page */}
          <box flexDirection="row" gap={1} alignItems="center">
            <text width={18}>Results/Page:</text>
            <input
              value={resultsPerPage()}
              onInput={(val: string) => setResultsPerPage(val)}
              placeholder="20"
              focused={focusIndex() === 1}
              width={10}
              backgroundColor={DEFAULT_THEME.bgSecondary}
              textColor={DEFAULT_THEME.fg}
            />
          </box>

          {/* Auto Embed */}
          <box flexDirection="row" gap={1} alignItems="center">
            <text width={18}>Auto Embed:</text>
            <text>{autoEmbed() ? "✓ Enabled" : "✗ Disabled"}</text>
            <box onMouseDown={() => setAutoEmbed((v) => !v)}>
              <text>Toggle</text>
            </box>
          </box>

          <box flexDirection="row" gap={2} marginTop={1}>
            <box onMouseDown={handleSave}>
              <text>Save</text>
            </box>
            <box onMouseDown={props.onClose}>
              <text>Cancel</text>
            </box>
          </box>

          <text fg={DEFAULT_THEME.fg}>
            Tab to navigate, Enter to save, Esc to cancel
          </text>
        </box>
      </box>
    </box>
  );
}
