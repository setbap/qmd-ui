import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { SearchBar } from '@/components/SearchBar'
import { CollectionPanel } from '@/components/CollectionPanel'
import { SearchResults } from '@/components/SearchResults'
import { CommandPalette } from '@/components/CommandPalette'
import { FileContentPanel } from '@/components/FileContentPanel'
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog'
import { SettingsDialog, type Settings } from '@/components/SettingsDialog'
import { useCollections } from '@/hooks/useCollections'
import { useAppSearch } from '@/hooks/useSearch'
import { useSettings } from '@/hooks/useSettings'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  embedCollection,
  getDocumentByCollection,
  type SearchMode,
} from '@/lib/server/qmd'
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
  lineNumber?: number
}

// URL search params type
interface HomeSearchParams {
  file?: string
  q?: string
  m?: string
  c?: string
}

function HomeComponent() {
  // Hooks
  const collections = useCollections()
  const search = useAppSearch()
  const settings = useSettings()
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = useSearch({ from: Route.fullPath }) as HomeSearchParams

  // Modal states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)

  // Load file from URL on mount
  useEffect(() => {
    const loadFileFromUrl = async () => {
      const fileParam = searchParams.file
      if (!fileParam) return

      // Parse qmd://collection/path format
      const match = fileParam.match(/^qmd:\/\/([^/]+)\/(.+)$/)
      if (!match) {
        console.error('Invalid file param format:', fileParam)
        return
      }

      const collectionName = match[1]
      const filePath = match[2]

      if (!collectionName || !filePath) {
        console.error('Invalid file param format:', fileParam)
        return
      }

      try {
        const result = await getDocumentByCollection({
          data: {
            collectionName,
            path: filePath,
          },
        })
        setSelectedFile({
          path: filePath,
          collectionName,
          title: result.title || filePath.split('/').pop() || filePath,
          content: result.content,
        })
      } catch (err) {
        console.error('Failed to load file from URL:', err)
        toast.error(`Failed to load file: ${filePath}`)
        // Clear invalid file param while preserving other params
        const { file, ...restParams } = searchParams
        navigate({ search: restParams })
      }
    }

    loadFileFromUrl()
  }, [searchParams, navigate])

  // Execute search from URL on page load (if query param exists)
  useEffect(() => {
    const queryFromUrl = searchParams.q
    if (queryFromUrl && queryFromUrl.trim()) {
      // Execute search with params from URL
      search.executeSearch({
        query: queryFromUrl,
        mode: (searchParams.m as SearchMode) || 'query',
        collection: searchParams.c || null,
      })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts: Ctrl+K for Command Palette, / for Search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      // / key: Focus search input (when not in an input field)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        // Don't trigger if user is typing in an input, textarea, or contenteditable element
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
          // search.setMode(action)
          search.executeSearch({
            mode: action,
            collection: search.collection,
            query: search.query,
          })
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

  // Handle result selection - opens file in panel like collection file click
  const handleSelectResult = useCallback(
    async (result: SearchResult) => {
      try {
        // Parse filepath: qmd://collection/path[:lineNumber]
        const filepathMatch = result.filepath.match(/^qmd:\/\/([^/]+)\/(.+)$/)
        if (!filepathMatch || !filepathMatch[1] || !filepathMatch[2]) {
          throw new Error(`Invalid filepath format: ${result.filepath}`)
        }

        let extractedCollectionName = filepathMatch[1]
        let path = filepathMatch[2]
        let lineNumber: number | undefined

        // Extract line number from path if present (e.g., "path:23")
        const lineMatch = path.match(/:(\d+)$/)
        if (lineMatch && lineMatch[1]) {
          lineNumber = parseInt(lineMatch[1], 10)
          path = path.replace(/:\d+$/, '')
        }

        const collectionName = result.collectionName || extractedCollectionName

        const result_data = await getDocumentByCollection({
          data: {
            collectionName,
            path,
          },
        })
        console.clear()
        console.log({ result_data })
        // Show content in the split panel
        setSelectedFile({
          path,
          collectionName,
          title:
            result_data.title || result.title || path.split('/').pop() || path,
          content: result_data.content,
          lineNumber,
        })
        // Update URL with file param while preserving other query params
        const fileParam = `qmd://${collectionName}/${path}`
        navigate({ search: { ...searchParams, file: fileParam } })
      } catch (err) {
        console.error('Failed to load file:', err)
        toast.error(`Failed to load file: ${result.filepath}`)
      }
    },
    [navigate, searchParams],
  )

  // Handle file click from CollectionPanel - updates URL
  const handleFileClick = useCallback(
    async (path: string, collectionName: string) => {
      try {
        const result = await getDocumentByCollection({
          data: {
            collectionName,
            path,
          },
        })
        // Show content in the split panel
        setSelectedFile({
          path,
          collectionName,
          title: result.title || path.split('/').pop() || path,
          content: result.content,
        })
        // Update URL with file param while preserving other query params
        const fileParam = `qmd://${collectionName}/${path}`
        navigate({ search: { ...searchParams, file: fileParam } })
      } catch (err) {
        console.error('Failed to load file:', err)
        toast.error(`Failed to load file: ${path}`)
      }
    },
    [navigate, searchParams],
  )

  // Handle closing file viewer - clears only file param from URL
  const handleCloseFile = useCallback(() => {
    setSelectedFile(null)
    const { file, ...restParams } = searchParams
    navigate({ search: restParams })
  }, [navigate, searchParams])

  // Convert AppSettings to Settings for the dialog
  const dialogSettings: Settings = {
    globalContext: settings.settings.globalContext ?? '',
    resultsPerPage: settings.settings.resultsPerPage,
    outputFormat:
      (settings.settings.outputFormat as Settings['outputFormat']) ?? 'cli',
  }

  // Get selected file path for CollectionPanel highlighting
  const selectedFilePath = selectedFile
    ? `qmd://${selectedFile.collectionName}/${selectedFile.path}`
    : null

  return (
    <>
      <Layout
        logo={<h1>QMD for Web</h1>}
        commandPalette={
          <Button
            size={'lg'}
            variant={'outline'}
            className={'w-64 justify-between'}
            onClick={() => setIsCommandPaletteOpen(true)}
          >
            <span>Search For commands...</span>
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
            onFileClick={handleFileClick}
            selectedFilePath={selectedFilePath}
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
                minSize={'200px'}
                className="h-full overflow-hidden"
              >
                <FileContentPanel
                  title={selectedFile.title}
                  content={selectedFile.content}
                  path={`qmd://${selectedFile.collectionName}/${selectedFile.path}`}
                  lineNumber={selectedFile.lineNumber}
                  onClose={handleCloseFile}
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
