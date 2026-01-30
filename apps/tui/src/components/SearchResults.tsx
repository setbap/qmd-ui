/**
 * SearchResults component - Display area for search results
 * SolidJS component using OpenTUI
 */

import { createMemo, For } from "solid-js";
import type { SearchResultsProps } from "../types/tui.js";
import { DEFAULT_THEME } from "../types/tui.js";

export function SearchResults(props: SearchResultsProps) {
  const hasResults = createMemo(() => props.results.length > 0);

  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + "%";
  };

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      backgroundColor={DEFAULT_THEME.bg}
      padding={1}
    >
      <text fg={DEFAULT_THEME.accent}>
        Search Results {props.query ? `for "${props.query}"` : ""}
      </text>

      <scrollbox height="100%">
        {hasResults() ? (
          <For each={props.results}>
            {(result, index) => (
              <box
                flexDirection="column"
                padding={1}
                style={{ marginBottom: 1 }}
                backgroundColor={DEFAULT_THEME.bgSecondary}
              >
                <box flexDirection="row" gap={1}>
                  <text fg={DEFAULT_THEME.accent}>{index() + 1}.</text>
                  <text fg={DEFAULT_THEME.fg}>
                    {result.title || result.displayPath}
                  </text>
                  <text fg={DEFAULT_THEME.fg}>
                    ({formatScore(result.score)})
                  </text>
                </box>

                <text fg={DEFAULT_THEME.fg}>
                  #{result.docid} | {result.displayPath}
                </text>

                {result.context && (
                  <text fg={DEFAULT_THEME.warning}>
                    Context: {result.context}
                  </text>
                )}

                <text fg={DEFAULT_THEME.fg}>
                  {(result.body ?? "").slice(0, 200)}...
                </text>
              </box>
            )}
          </For>
        ) : (
          <text fg={DEFAULT_THEME.fg}>
            {props.query
              ? "No results found. Try a different query."
              : "Enter a search query to begin..."}
          </text>
        )}
      </scrollbox>
    </box>
  );
}
