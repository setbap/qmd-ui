import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { SearchBar } from '@/components/SearchBar'
import { CollectionPanel } from '@/components/CollectionPanel'
import { SearchResults } from '@/components/SearchResults'
import { CommandPalette } from '@/components/CommandPalette'
import { FileViewer } from '@/components/FileViewer'
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog'
import { SettingsDialog, type Settings } from '@/components/SettingsDialog'
import { useCollections } from '@/hooks/useCollections'
import { useAppSearch } from '@/hooks/useSearch'
import { useFileContent } from '@/hooks/useFileContent'
import { useSettings } from '@/hooks/useSettings'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { embedCollection, clearIndexCache } from '@/lib/server/qmd'
import type { SearchResult } from '@/components/SearchResults'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  // Hooks
  const collections = useCollections()
  const search = useAppSearch()
  const settings = useSettings()

  // Modal states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState<string | null>(null)
  const [viewingCollection, setViewingCollection] = useState<string | null>(
    null,
  )

  // File content query
  const fileContent = useFileContent(viewingFile, viewingCollection)

  // Command palette actions
  const handleCommandAction = useCallback(async (action: string) => {
    setIsCommandPaletteOpen(false)

    switch (action) {
      case 'search':
        // Focus search input (implement via ref if needed)
        break
      case 'createCollection':
        setIsCreateDialogOpen(true)
        break
      case 'settings':
        setIsSettingsOpen(true)
        break
      case 'embed':
        try {
          toast.promise(embedCollection(), {
            loading: 'Generating embeddings...',
            success: 'Embeddings generated successfully',
            error: 'Failed to generate embeddings',
          })
        } catch {
          toast.error('Failed to start embedding')
        }
        break
      case 'clearCache':
        try {
          await clearIndexCache()
          toast.success('Cache cleared')
        } catch {
          toast.error('Failed to clear cache')
        }
        break
    }
  }, [])

  // Handle collection selection
  const handleCollectionSelect = useCallback(
    (name: string | null) => {
      search.selectCollection(name)
      // Re-run search if there's a query
      if (search.query.trim()) {
        search.executeSearch()
      }
    },
    [search],
  )

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    const path = result.filepath.replace(/^qmd:\/\/[^/]+\//, '')
    setViewingFile(path)
    setViewingCollection(result.collectionName)
  }, [])

  // Convert AppSettings to Settings for the dialog
  const dialogSettings: Settings = {
    globalContext: settings.settings.globalContext ?? '',
    resultsPerPage: settings.settings.resultsPerPage,
    outputFormat:
      (settings.settings.outputFormat as Settings['outputFormat']) ?? 'cli',
  }

  return (
    <>
      <Layout
        commandPalette={
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1a1d23] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
          >
            <span>Search commands...</span>
            <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs">
              ⌘K
            </kbd>
          </button>
        }
        searchBar={
          <SearchBar
            value={search.query}
            onChange={search.setQuery}
            onSubmit={search.executeSearch}
            mode={search.mode}
            onModeChange={search.setMode}
            selectedCollection={search.collection}
          />
        }
      >
        <div className="flex w-full gap-4">
          {/* Search Results - 70% */}
          <div className="flex h-full w-full flex-col">
            <SearchResults
              results={search.results}
              isLoading={search.isLoading}
              query={search.query}
              onSelectResult={handleSelectResult}
            />
          </div>

          {/* Collection Panel - 30% */}
          <div className="flex h-full w-100 flex-col">
            <CollectionPanel
              collections={collections.collections}
              isLoading={collections.isLoading}
              selectedCollection={search.collection}
              expandedCollections={collections.expandedCollections}
              onSelectCollection={handleCollectionSelect}
              onToggleExpand={collections.toggleExpand}
              onUpdateCollection={async (name) => {
                try {
                  await collections.updateCollection(name)
                  toast.success(`Collection "${name}" updated`)
                } catch {
                  toast.error(`Failed to update collection "${name}"`)
                }
              }}
              onDeleteCollection={async (name) => {
                try {
                  await collections.deleteCollection(name)
                  toast.success(`Collection "${name}" deleted`)
                } catch {
                  toast.error(`Failed to delete collection "${name}"`)
                }
              }}
            />
          </div>
        </div>
      </Layout>

      {/* Modals */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onAction={handleCommandAction}
      />

      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={async (name: string, path: string, pattern: string) => {
          try {
            await collections.createCollection({ name, path, pattern })
            toast.success(`Collection "${name}" created`)
            setIsCreateDialogOpen(false)
          } catch {
            toast.error(`Failed to create collection "${name}"`)
          }
        }}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={dialogSettings}
        onUpdate={async (data: Partial<Settings>) => {
          try {
            await settings.updateSettings({
              globalContext: data.globalContext,
              resultsPerPage: data.resultsPerPage,
              outputFormat: data.outputFormat as AppSettings['outputFormat'],
            })
            toast.success('Settings updated')
          } catch {
            toast.error('Failed to update settings')
          }
        }}
      />

      <FileViewer
        open={!!viewingFile}
        onOpenChange={(open) => {
          if (!open) {
            setViewingFile(null)
            setViewingCollection(null)
          }
        }}
        content={fileContent.data?.content ?? ''}
        title={fileContent.data?.title ?? viewingFile ?? ''}
        path={fileContent.data?.filepath ?? ''}
      />

      <Toaster theme="dark" position="bottom-right" />
    </>
  )
}

// Import AppSettings type for reference
type AppSettings = {
  globalContext?: string
  outputFormat: 'text' | 'json' | 'markdown'
  resultsPerPage: number
}
