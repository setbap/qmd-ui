/**
 * CommandPalette component - Modal for general actions (Ctrl+P)
 * SolidJS component using OpenTUI
 */

import { createSignal, createMemo } from "solid-js";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import type { CommandPaletteProps, CommandOption } from "../types/tui.js";
import { COMMAND_OPTIONS, DEFAULT_THEME } from "../types/tui.js";

export function CommandPalette(props: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const options = createMemo(() => {
    return COMMAND_OPTIONS.map((cmd) => ({
      name: cmd.name,
      description: `${cmd.description}${cmd.shortcut ? ` (${cmd.shortcut})` : ""}`,
    }));
  });

  // Handle keyboard shortcuts
  useKeyboard((key) => {
    if (key.name === "escape") {
      props.onClose();
      return;
    }

    if (key.name === "enter") {
      const idx = selectedIndex();
      const action = COMMAND_OPTIONS[idx];
      if (action) {
        props.onAction(action.action);
      }
      return;
    }

    if (key.name === "up" || key.name === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.name === "down" || key.name === "j") {
      setSelectedIndex((i) => Math.min(COMMAND_OPTIONS.length - 1, i + 1));
      return;
    }
  });

  const dim = useTerminalDimensions();

  return (
    <box
      border={false}
      backgroundColor={DEFAULT_THEME.bg}
      style={{
        position: "absolute",
        top: dim().height / 4,
        left: dim().width / 2 - 35,
      }}
    >
      <box
        border
        borderStyle="rounded"
        padding={1}
        width={70}
        height={15}
        backgroundColor={DEFAULT_THEME.bg}
      >
        <box flexDirection="column" gap={1}>
          <text fg={DEFAULT_THEME.accent}>Command Palette (Ctrl+P)</text>
          <select
            options={options()}
            onSelect={(
              idx: number,
              _option: { name: string; description: string } | null,
            ) => {
              const action = COMMAND_OPTIONS[idx];
              if (action) {
                props.onAction(action.action);
              }
            }}
            onChange={(
              idx: number,
              _option: { name: string; description: string } | null,
            ) => setSelectedIndex(idx)}
            selectedIndex={selectedIndex()}
            focused
            height={8}
            showScrollIndicator
            selectedBackgroundColor={DEFAULT_THEME.accent}
            selectedTextColor={DEFAULT_THEME.bg}
          />
          <text fg={DEFAULT_THEME.fg}>
            ↑↓ to navigate, Enter to select, Esc to close
          </text>
        </box>
      </box>
    </box>
  );
}
