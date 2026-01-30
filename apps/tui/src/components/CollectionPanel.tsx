/**
 * CollectionPanel component - Right sidebar with collection list
 * SolidJS component using OpenTUI
 *
 * New design:
 * - [•] All Collections (always at top, never expands)
 * - [ ] Collection Name                     [+]
 * - [ ] Collection Name                     [+]
 *
 * Left side click = select collection for search
 * [+] button click = expand to show files
 */

import { For, Show, createResource } from "solid-js";
import type { NamedCollection } from "@qmd/core";
import { createStore, getActiveDocumentPaths } from "@qmd/core";
import { DEFAULT_THEME } from "../types/tui.js";

interface CollectionPanelProps {
  readonly collections: () => readonly NamedCollection[] | undefined;
  readonly isLoading: () => boolean;
  readonly error: () => Error | undefined;
  readonly selectedCollection: () => string | null;
  readonly onSelectCollection: (name: string | null) => void;
  readonly expandedCollections: () => ReadonlySet<string>;
  readonly onToggleExpand: (name: string) => void;
  readonly onUpdateCollection: (name: string) => void;
  readonly onDeleteCollection: (name: string) => void;
}

export function CollectionPanel(props: CollectionPanelProps) {
  const hasCollections = () => (props.collections()?.length ?? 0) > 0;

  return (
    <box flexDirection="column" flexGrow={1} border title="Collections">
      <scrollbox flexGrow={1} padding={1}>
        <Show when={!props.isLoading()} fallback={<text>Loading...</text>}>
          <Show
            when={!props.error()}
            fallback={
              <text fg={DEFAULT_THEME.error}>
                Error: {props.error()?.message}
              </text>
            }
          >
            <box flexDirection="row" gap={1} alignItems="center">
              <text
                fg={
                  props.selectedCollection() === null
                    ? DEFAULT_THEME.accent
                    : DEFAULT_THEME.fg
                }
                onMouseDown={() => props.onSelectCollection(null)}
              >
                {props.selectedCollection() === null ? "[•]" : "[ ]"} All
                Collections
              </text>
            </box>

            <Show
              when={hasCollections()}
              fallback={<text fg={DEFAULT_THEME.fg}>No collections</text>}
            >
              <box marginTop={1}>
                <For each={props.collections()}>
                  {(collection) => (
                    <CollectionItem
                      collection={collection}
                      isSelected={
                        props.selectedCollection() === collection.name
                      }
                      isExpanded={props
                        .expandedCollections()
                        .has(collection.name)}
                      onSelect={() => props.onSelectCollection(collection.name)}
                      onToggleExpand={() =>
                        props.onToggleExpand(collection.name)
                      }
                      onUpdate={() => props.onUpdateCollection(collection.name)}
                      onDelete={() => props.onDeleteCollection(collection.name)}
                    />
                  )}
                </For>
              </box>
            </Show>
          </Show>
        </Show>
      </scrollbox>
    </box>
  );
}

interface CollectionItemProps {
  readonly collection: NamedCollection;
  readonly isSelected: boolean;
  readonly isExpanded: boolean;
  readonly onSelect: () => void;
  readonly onToggleExpand: () => void;
  readonly onUpdate: () => void;
  readonly onDelete: () => void;
}

function CollectionItem(props: CollectionItemProps) {
  // Fetch files when expanded
  const [files] = createResource(
    () => (props.isExpanded ? props.collection.name : null),
    async (collectionName) => {
      if (!collectionName) return [];
      try {
        const store = await createStore();
        const paths = getActiveDocumentPaths(store.db, collectionName);
        return paths.map((path: string) => ({ path, docid: "" }));
      } catch (err) {
        console.error("Failed to load files:", err);
        return [];
      }
    },
  );

  return (
    <box flexDirection="column" marginBottom={1}>
      {/* Collection row with selection indicator and expand button */}
      <box
        flexDirection="row"
        gap={1}
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Left: Selection indicator + name */}
        <text
          fg={props.isSelected ? DEFAULT_THEME.accent : DEFAULT_THEME.fg}
          onMouseDown={props.onSelect}
        >
          {props.isSelected ? "[•]" : "[  ]"} {props.collection.name}
        </text>

        {/* Right: Expand [+] button */}
        <text fg={DEFAULT_THEME.accent} onMouseDown={props.onToggleExpand}>
          {props.isExpanded ? "[-]" : "[+]"}
        </text>
      </box>

      {/* Expanded content */}
      <Show when={props.isExpanded}>
        <box flexDirection="column" paddingLeft={2} marginTop={0}>
          <text fg={DEFAULT_THEME.fg}>Path: {props.collection.path}</text>
          <text fg={DEFAULT_THEME.fg}>Pattern: {props.collection.pattern}</text>

          {/* Action buttons */}
          <box flexDirection="row" gap={2} marginTop={1}>
            <text fg={DEFAULT_THEME.success} onMouseDown={props.onUpdate}>
              [Update]
            </text>
            <text fg={DEFAULT_THEME.error} onMouseDown={props.onDelete}>
              [Delete]
            </text>
          </box>

          {/* Files list */}
          <box flexDirection="column" marginTop={1}>
            <text fg={DEFAULT_THEME.accent}>Files:</text>
            <Show
              when={!files.loading}
              fallback={<text fg={DEFAULT_THEME.fg}>Loading...</text>}
            >
              <Show
                when={files() && files()!.length > 0}
                fallback={<text fg={DEFAULT_THEME.fg}>No files indexed</text>}
              >
                <For each={files()}>
                  {(file) => (
                    <text fg={DEFAULT_THEME.fg} paddingLeft={1}>
                      📄 {file.path}
                    </text>
                  )}
                </For>
              </Show>
            </Show>
          </box>
        </box>
      </Show>
    </box>
  );
}
