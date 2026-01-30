/**
 * SearchInput component - Single-line text input for search queries
 * SolidJS component using OpenTUI
 */

import type { SearchInputProps } from "../types/tui.js";

export function SearchInput(props: SearchInputProps) {
  return (
    <input
      value={props.value}
      onInput={(value: string) => {
        props.onInput(value);
      }}
      onSubmit={() => {
        props.onSubmit();
      }}
      placeholder={props.placeholder ?? "Search..."}
      focused={props.focused ?? true}
      width={60}
      backgroundColor="#1a1b26"
      textColor="#a9b1d6"
      cursorColor="#7aa2f7"
      focusedBackgroundColor="#24283b"
      placeholderColor="#565f89"
    />
  );
}
