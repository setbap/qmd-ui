import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { SearchBar } from '@/components/SearchBar'
import { CollectionPanel } from '@/components/collection/CollectionPanel'
import { SearchResults } from '@/components/SearchResults'
import { CommandPalette } from '@/components/CommandPalette'
import { FileContentPanel } from '@/components/FileContentPanel'
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog'
import { SettingsDialog, type Settings } from '@/components/SettingsDialog'
import {
  SearchHistoryButton,
  SearchHistoryModal,
} from '@/components/modals/SearchHistoryModal'
import { useCollections } from '@/hooks/useCollections'
import { useSettings } from '@/hooks/useSettings'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { embedCollection, type SearchMode } from '@/lib/server/qmd'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { useUIStore, useFileViewerStore, useSearchStore } from '@/stores'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

// URL search params type
interface HomeSearchParams {
  file?: string
  q?: string
  m?: string
  c?: string
}

function HomeComponent() {
  // Server state hooks (React Query)
  const collections = useCollections()
  const settings = useSettings()
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = useSearch({ from: Route.fullPath }) as HomeSearchParams

  // UI State (Zustand stores)
  const {
    isCommandPaletteOpen,
    isCreateDialogOpen,
    isSettingsOpen,
    openCommandPalette,
    closeCommandPalette,
    openCreateDialog,
    closeCreateDialog,
    openSettings,
    closeSettings,
    openSearchHistory,
  } = useUIStore()

  const {
    selectedFile,
    openFromSearch,
    openFromCollection,
    close: closeFileViewer,
  } = useFileViewerStore()

  const {
    query,
    setQuery,
    mode,
    setMode,
    collection,
    setCollection,
    executeSearch,
    results,
    isLoading: isSearchLoading,
  } = useSearchStore()

  // Sync URL params to store on mount
  useEffect(() => {
    const queryFromUrl = searchParams.q
    const modeFromUrl = searchParams.m as SearchMode
    const collectionFromUrl = searchParams.c

    if (queryFromUrl) setQuery(queryFromUrl)
    if (modeFromUrl) setMode(modeFromUrl)
    if (collectionFromUrl) setCollection(collectionFromUrl)

    // Execute search if query exists
    if (queryFromUrl?.trim()) {
      executeSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        await openFromCollection(filePath, collectionName)
      } catch (err) {
        console.error('Failed to load file from URL:', err)
        toast.error(`Failed to load file: ${filePath}`)
        // Clear invalid file param while preserving other params
        const { file, ...restParams } = searchParams
        navigate({ search: restParams })
      }
    }

    loadFileFromUrl()
  }, [searchParams.file])

  // Update URL when search params change
  useEffect(() => {
    const urlParams: Record<string, string> = {}

    // Preserve existing file param if present
    if (searchParams.file) {
      urlParams.file = searchParams.file
    }

    if (query.trim()) urlParams.q = query.trim()
    if (mode !== 'query') urlParams.m = mode
    if (collection) urlParams.c = collection

    navigate({
      to: '/',
      search: urlParams,
      replace: true,
    })
  }, [query, mode, collection])

  // Update URL when selected file changes
  useEffect(() => {
    if (selectedFile) {
      const fileParam = `qmd://${selectedFile.collectionName}/${selectedFile.path}`
      navigate({
        to: '/',
        search: { ...searchParams, file: fileParam },
        replace: true,
      })
    }
  }, [selectedFile?.path, selectedFile?.collectionName])

  // Keyboard shortcuts: Ctrl+K for Command Palette, / for Search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
      // Cmd/Ctrl+.: Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault()
        openSettings()
      }
      // Cmd/Ctrl+H: Open History
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        openSearchHistory()
      }
      // / key: Focus search input (when not in an input field)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
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
  }, [openCommandPalette, openSettings, openSearchHistory])

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
      closeCommandPalette()

      switch (action) {
        case 'search':
        case 'vsearch':
        case 'query':
          setMode(action)
          if (query.trim()) {
            await executeSearch()
          }
          break
        case 'createCollection':
          openCreateDialog()
          break
        case 'updateCollection':
          toast.info('Select a collection to update')
          break
        case 'deleteCollection':
          toast.info('Select a collection to delete')
          break
        case 'settings':
          openSettings()
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
    [
      closeCommandPalette,
      setMode,
      query,
      executeSearch,
      openCreateDialog,
      openSettings,
    ],
  )

  // Handle collection selection
  const handleCollectionSelect = useCallback(
    async (name: string | null) => {
      setCollection(name)
      // Re-run search if there's a query
      if (query.trim()) {
        await executeSearch()
      }
    },
    [setCollection, query, executeSearch],
  )

  // Handle result selection - uses file viewer store
  const handleSelectResult = useCallback(
    async (result: {
      filepath: string
      title: string | null
      content: string
    }) => {
      try {
        await openFromSearch(result)
      } catch (err) {
        console.error('Failed to load file:', err)
        toast.error(`Failed to load file: ${result.filepath}`)
      }
    },
    [openFromSearch],
  )

  // Handle closing file viewer
  const handleCloseFile = useCallback(() => {
    closeFileViewer()
    const { file, ...restParams } = searchParams
    navigate({ search: restParams })
  }, [closeFileViewer, navigate, searchParams])

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
        logo={
          <h1
            title="QMD Web"
            className="select-none font-mono text-primary font-bold   bg-neutral-50 outline-1 px- p-1 rounded-md"
          >
            QMD Web
          </h1>
        }
        commandPalette={
          <div className="flex items-center gap-2">
            <SearchHistoryButton />
            <Button
              size={'lg'}
              variant={'outline'}
              className={'w-64 justify-between'}
              onClick={openCommandPalette}
            >
              <span>Search For commands...</span>
              <Kbd>⌘K</Kbd>
            </Button>
          </div>
        }
        sideBar={
          <CollectionPanel
            collections={collections.collections}
            isLoading={collections.isLoading}
            selectedCollection={collection}
            onSelectCollection={handleCollectionSelect}
            onUpdateCollection={async (name: string) => {
              await collections.updateCollection(name)
            }}
            onDeleteCollection={async (name: string) => {
              await collections.deleteCollection(name)
            }}
            onRenameCollection={async (oldName: string, newName: string) => {
              await collections.renameCollection({ oldName, newName })
            }}
            onCreateCollection={openCreateDialog}
            getCollectionFiles={collections.fetchCollectionFiles}
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
                    results={results as any}
                    isLoading={isSearchLoading}
                    query={query}
                    onSelectResult={handleSelectResult as any}
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
                results={results as any}
                isLoading={isSearchLoading}
                query={query}
                onSelectResult={handleSelectResult as any}
              />
            </div>
          )}

          <SearchBar />
        </div>
      </Layout>

      {/* Modals */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={closeCommandPalette}
        onAction={handleCommandAction}
      />

      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={closeCreateDialog}
        onCreate={async (name: string, path: string, pattern: string) => {
          try {
            await collections.createCollection({ name, path, pattern })
          } catch (err) {
            console.error('Failed to create collection:', err)
          }
        }}
        isCreating={collections.isCreating}
        isIndexing={
          collections.activeJobs.size > 0 &&
          Array.from(collections.activeJobs.values()).some(
            (job) => job.status === 'pending' || job.status === 'running',
          )
        }
        indexingProgress={
          collections.activeJobs.size > 0
            ? (() => {
                const jobs = Array.from(collections.activeJobs.values())
                const runningJob =
                  jobs.find((job) => job.status === 'running') || jobs[0]
                return runningJob?.progress || null
              })()
            : null
        }
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={closeSettings}
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

      <SearchHistoryModal />

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
