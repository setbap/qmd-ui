import { createSignal, Show } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import { enableProductionMode } from "@qmd/core";
import { useSettings } from "./hooks/useSettings.js";
import { useCollections } from "./hooks/useCollections.js";
import { useSearch } from "./hooks/useSearch.js";
import { SearchInput } from "./components/SearchInput.js";
import { SearchResults } from "./components/SearchResults.js";
import { CollectionPanel } from "./components/CollectionPanel.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { CreateCollectionModal } from "./components/CreateCollectionModal.js";
import { SettingsModal } from "./components/SettingsModal.js";
import type { CommandAction, ModalType } from "./types/tui.js";
import { DEFAULT_THEME } from "./types/tui.js";

export function App() {
  // Enable production mode for QMD
  enableProductionMode();

  // Initialize hooks
  const settings = useSettings();
  const collections = useCollections();
  const search = useSearch(settings.settings);
  const renderer = useRenderer();

  // Modal state
  const [activeModal, setActiveModal] = createSignal<ModalType>(null);

  // Handle command palette actions
  const handleCommandAction = (action: CommandAction) => {
    switch (action) {
      case "embed":
        setActiveModal(null);
        break;
      case "createCollection":
        setActiveModal("createCollection");
        break;
      case "changeSearchMode":
        search.cycleMode();
        setActiveModal(null);
        break;
      case "settings":
        setActiveModal("settings");
        break;
      case "quit":
        renderer.destroy();
        process.exit(0);
        break;
    }
  };

  // Handle keyboard shortcuts
  useKeyboard((key) => {
    // Ctrl+P - Open Command Palette
    if (key.ctrl && key.name === "p") {
      setActiveModal((current) =>
        current === "commandPalette" ? null : "commandPalette",
      );
      return;
    }

    // Ctrl+S - Open Settings
    if (key.ctrl && key.name === "s") {
      setActiveModal("settings");
      return;
    }

    // Ctrl+C - Quit
    if (key.ctrl && key.name === "c") {
      renderer.destroy();
      process.exit(0);
      return;
    }

    // Ctrl+A - Search all collections (clear selection)
    if (key.ctrl && key.name === "a") {
      collections.selectCollection(null);
      // Re-run search with all collections if there's a query
      if (search.query().trim()) {
        void search.executeSearch(null);
      }
      return;
    }

    // Tab - Cycle search mode (when no modal is open and search input not focused)
    if (key.name === "tab" && !activeModal()) {
      search.cycleMode();
      return;
    }

    // Escape - Close modals
    if (key.name === "escape" && activeModal()) {
      setActiveModal(null);
      return;
    }

    // Enter - Execute search (when no modal is open)
    if (key.name === "enter" && !activeModal()) {
      void search.executeSearch(collections.selectedCollection());
      return;
    }

    if (key.ctrl && key.name === "`") {
      renderer.console.toggle();
    }
  });

  const selectedCollectionName = () => {
    const name = collections.selectedCollection();
    return name || "All Collections";
  };

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={DEFAULT_THEME.bg}
    >
      {/* Main content area */}
      <box flexDirection="row" flexGrow={1}>
        {/* Left: Search results - 80% */}
        <Show
          when={!search.isLoading()}
          fallback={
            <box flexGrow={4} border borderColor={DEFAULT_THEME.border}>
              <text>loading...</text>
            </box>
          }
        >
          <box flexGrow={4} border borderColor={DEFAULT_THEME.border}>
            <SearchResults
              results={search.results()}
              query={search.query()}
              format={settings.outputFormat()}
              onSelectResult={(result) => {
                console.log("Selected:", result.displayPath);
              }}
            />
          </box>
        </Show>

        {/* Right: Collections panel - 20% */}
        <box width="20%" flexGrow={0} border={false}>
          <CollectionPanel
            collections={collections.collections}
            isLoading={collections.isLoading}
            error={collections.error}
            selectedCollection={collections.selectedCollection}
            onSelectCollection={(name) => {
              collections.selectCollection(name);
              // Re-run search with new collection if there's a query
              if (search.query().trim()) {
                void search.executeSearch(name);
              }
            }}
            expandedCollections={collections.expandedCollections}
            onToggleExpand={collections.toggleExpand}
            onUpdateCollection={(name) => {
              console.log("Update collection:", name);
            }}
            onDeleteCollection={async (name) => {
              await collections.deleteCollection(name);
            }}
          />
        </box>
      </box>

      {/* Bottom: Search bar */}
      <box
        height={3}
        border
        borderColor={DEFAULT_THEME.border}
        flexDirection="row"
        alignItems="center"
        paddingLeft={1}
        paddingRight={1}
        gap={2}
      >
        <text fg={DEFAULT_THEME.accent}>Search:</text>
        <SearchInput
          value={search.query()}
          onInput={search.setQuery}
          onSubmit={() =>
            search.executeSearch(collections.selectedCollection())
          }
          placeholder="Type to search..."
          focused={!activeModal()}
        />
      </box>

      {/* Status bar - Shows mode and collection */}
      <box
        height={1}
        paddingLeft={1}
        flexDirection="row"
        gap={1}
        backgroundColor={DEFAULT_THEME.bgSecondary}
      >
        <text fg={DEFAULT_THEME.accent}>
          Mode: {search.mode().toUpperCase()} (tab to switch)
        </text>
        <text fg={DEFAULT_THEME.border}>|</text>
        <text fg={DEFAULT_THEME.fg}>
          Collection: {selectedCollectionName()}
        </text>
        <text fg={DEFAULT_THEME.border}>|</text>
        <text fg={DEFAULT_THEME.fg}>
          Ctrl+P: Palette | Ctrl+S: Settings | Ctrl+Q: Quit | Ctrl+A: All |
          Enter: Search | Tab: Mode
        </text>
      </box>

      {/* Modals */}
      <Show when={activeModal() === "commandPalette"}>
        <CommandPalette
          onAction={handleCommandAction}
          onClose={() => setActiveModal(null)}
        />
      </Show>

      <Show when={activeModal() === "createCollection"}>
        <CreateCollectionModal
          onCreate={async (name, path, pattern) => {
            await collections.createCollection(name, path, pattern);
          }}
          onClose={() => setActiveModal(null)}
        />
      </Show>

      <Show when={activeModal() === "settings"}>
        <SettingsModal
          settings={settings.settings()}
          onUpdate={settings.updateSettings}
          onClose={() => setActiveModal(null)}
        />
      </Show>
    </box>
  );
}
