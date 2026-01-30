/**
 * CreateCollectionModal component - Dialog for adding new collections
 * SolidJS component using OpenTUI
 */

import { createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { CreateCollectionModalProps } from "../types/tui.js";
import { DEFAULT_THEME } from "../types/tui.js";

export function CreateCollectionModal(props: CreateCollectionModalProps) {
  const [name, setName] = createSignal("");
  const [path, setPath] = createSignal("");
  const [pattern, setPattern] = createSignal("**/*.md");
  const [focusIndex, setFocusIndex] = createSignal(0);
  const [error, setError] = createSignal<string | null>(null);

  const fields = [
    { label: "Name", value: name, setValue: setName, placeholder: "my-collection" },
    { label: "Path", value: path, setValue: setPath, placeholder: "/path/to/docs" },
    { label: "Pattern", value: pattern, setValue: setPattern, placeholder: "**/*.md" },
  ];

  useKeyboard((key) => {
    if (key.name === "escape") {
      props.onClose();
      return;
    }

    if (key.name === "tab") {
      setFocusIndex((i) => (i + 1) % fields.length);
      return;
    }

    if (key.name === "enter" && focusIndex() === fields.length - 1) {
      handleSubmit();
      return;
    }
  });

  const handleSubmit = (): void => {
    const nameValue = name().trim();
    const pathValue = path().trim();
    const patternValue = pattern().trim() || "**/*.md";

    if (!nameValue) {
      setError("Collection name is required");
      return;
    }

    if (!pathValue) {
      setError("Path is required");
      return;
    }

    setError(null);
    props.onCreate(nameValue, pathValue, patternValue);
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
        height={18}
        backgroundColor={DEFAULT_THEME.bg}
      >
        <box flexDirection="column" gap={1}>
          <text fg={DEFAULT_THEME.accent}>
            Create New Collection
          </text>

          {fields.map((field, i) => (
            <box flexDirection="row" gap={1} alignItems="center">
              <text width={10}>{field.label}:</text>
              <input
                value={field.value()}
                onInput={field.setValue}
                placeholder={field.placeholder}
                focused={focusIndex() === i}
                width={40}
                backgroundColor={DEFAULT_THEME.bgSecondary}
                textColor={DEFAULT_THEME.fg}
                cursorColor={DEFAULT_THEME.accent}
              />
            </box>
          ))}

          {error() && (
            <text fg={DEFAULT_THEME.error}>{error()}</text>
          )}

          <box flexDirection="row" gap={2} style={{ marginTop: 1 }}>
            <box onMouseDown={handleSubmit}>
              <text>Create</text>
            </box>
            <box onMouseDown={props.onClose}>
              <text>Cancel</text>
            </box>
          </box>

          <text fg={DEFAULT_THEME.fg}>
            Tab to navigate, Enter to submit, Esc to cancel
          </text>
        </box>
      </box>
    </box>
  );
}
