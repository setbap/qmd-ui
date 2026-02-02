import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { SearchBar } from '@/components/SearchBar'
import { CollectionPanel } from '@/components/CollectionPanel'
import { SearchResults } from '@/components/SearchResults'
import { CommandPalette } from '@/components/CommandPalette'
import { FileViewer } from '@/components/FileViewer'
import { FileContentPanel } from '@/components/FileContentPanel'
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog'
import { SettingsDialog, type Settings } from '@/components/SettingsDialog'
import { useCollections } from '@/hooks/useCollections'
import { useAppSearch } from '@/hooks/useSearch'
import { useFileContent } from '@/hooks/useFileContent'
import { useSettings } from '@/hooks/useSettings'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { embedCollection, getDocumentByCollection } from '@/lib/server/qmd'
import type { SearchResult } from '@/components/SearchResults'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

interface SelectedFile {
  path: string
  collectionName: string
  title: string
  content: string
}

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
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)

  // File content query
  const fileContent = useFileContent(viewingFile, viewingCollection)

  // Command palette actions
  const handleCommandAction = useCallback(
    async (
      action:
        | 'createCollection'
        | 'updateCollection'
        | 'deleteCollection'
        | 'embed'
        | 'settings'
        | 'search'
        | 'vsearch'
        | 'query',
    ) => {
      setIsCommandPaletteOpen(false)

      switch (action) {
        case 'search':
        case 'vsearch':
        case 'query':
          // Set search mode and focus search input
          search.setMode(action)
          break
        case 'createCollection':
          setIsCreateDialogOpen(true)
          break
        case 'updateCollection':
          // TODO: Show collection selection dialog
          toast.info('Select a collection to update')
          break
        case 'deleteCollection':
          // TODO: Show collection selection dialog
          toast.info('Select a collection to delete')
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
      }
    },
    [search],
  )

  // Handle collection selection
  const handleCollectionSelect = useCallback(
    (name: string | null) => {
      search.selectCollection(name)
      // Re-run search if there's a query
      if (search.query.trim()) {
        search.executeSearch({ collection: name })
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
          <Button
            size={'lg'}
            variant={'outline'}
            onClick={() => setIsCommandPaletteOpen(true)}
          >
            <span>Search commands...</span>
            <Kbd>⌘K</Kbd>
          </Button>
        }
        sideBar={
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
            onRenameCollection={async (oldName, newName) => {
              try {
                await collections.renameCollection({ oldName, newName })
                toast.success(`Collection renamed to "${newName}"`)
              } catch {
                toast.error(`Failed to rename collection "${oldName}"`)
              }
            }}
            onCreateCollection={() => setIsCreateDialogOpen(true)}
            getCollectionFiles={collections.fetchCollectionFiles}
            onFileClick={async (path, collectionName) => {
              try {
                const result = await getDocumentByCollection({
                  data: {
                    collectionName,
                    path,
                  },
                })
                console.log('File content loaded:', result)
                // Show content in the split panel
                setSelectedFile({
                  path,
                  collectionName,
                  title: result.title || path.split('/').pop() || path,
                  content: result.content,
                })
                // Also update viewing state for modal fallback
                setViewingFile(path)
                setViewingCollection(collectionName)
              } catch (err) {
                console.error('Failed to load file:', err)
                toast.error(`Failed to load file: ${path}`)
              }
            }}
          />
        }
      >
        <div className="flex w-full flex-col overflow-hidden">
          {selectedFile ? (
            <ResizablePanelGroup className="h-full">
              <ResizablePanel
                defaultSize={50}
                minSize={30}
                className="h-full overflow-hidden"
              >
                <div className="h-full overflow-hidden">
                  <SearchResults
                    results={search.results}
                    isLoading={search.isLoading}
                    query={search.query}
                    onSelectResult={handleSelectResult}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={50}
                minSize={30}
                className="h-full overflow-hidden"
              >
                <FileContentPanel
                  title={selectedFile.title}
                  content={selectedFile.content}
                  path={`qmd://${selectedFile.collectionName}/${selectedFile.path}`}
                  onClose={() => setSelectedFile(null)}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full overflow-hidden">
              <SearchResults
                results={search.results}
                isLoading={search.isLoading}
                query={search.query}
                onSelectResult={handleSelectResult}
              />
            </div>
          )}

          <SearchBar
            value={search.query}
            onChange={search.setQuery}
            onSubmit={search.executeSearch}
            mode={search.mode}
            onModeChange={search.setMode}
            selectedCollection={search.collection}
          />
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
