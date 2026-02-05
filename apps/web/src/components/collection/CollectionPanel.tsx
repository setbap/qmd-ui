'use client'

import { useCallback, useState } from 'react'
import {
  RiFolderLine,
  RiFileTextLine,
  RiArrowRightSLine,
  RiDatabase2Line,
  RiAddLine,
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiQuestionLine,
} from '@remixicon/react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useCollectionsStore, useFileViewerStore } from '@/stores'
import { CollectionDialogs } from './CollectionDialogs'
import { CollectionMenu } from './CollectionMenu'
import { useTheme } from '@/components/ThemeProvider'
import { AppInfoModal } from '@/components/AppInfoModal'

// Collection type matching what the server returns (from YAML config)
interface Collection {
  name: string
  path: string
  pattern: string
  context?: Record<string, string>
  update?: string
}

// File info from the database
interface FileInfo {
  path: string
  title?: string
}

interface CollectionPanelProps {
  collections: Collection[]
  selectedCollection: string | null
  onSelectCollection: (name: string | null) => void
  onUpdateCollection: (name: string) => Promise<void>
  onDeleteCollection: (name: string) => Promise<void>
  onRenameCollection: (oldName: string, newName: string) => Promise<void>
  onCreateCollection: () => void
  getCollectionFiles: (name: string) => Promise<FileInfo[]>
  isLoading?: boolean
  error?: Error | null
}

export function CollectionPanel({
  collections,
  selectedCollection,
  onSelectCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRenameCollection,
  onCreateCollection,
  getCollectionFiles,
  isLoading = false,
  error = null,
}: CollectionPanelProps) {
  const {
    expandedCollections,
    toggleExpand,
    collectionFiles,
    filesLoading,
    setCollectionFiles,
    setFilesLoading,
    clearFileCache,
  } = useCollectionsStore()
  const { selectedFile } = useFileViewerStore()
  const { theme, setTheme } = useTheme()
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false)

  const selectedFilePath = selectedFile
    ? `qmd://${selectedFile.collectionName}/${selectedFile.path}`
    : null

  const handleToggleExpand = useCallback(
    async (collectionName: string) => {
      const isExpanding = !expandedCollections.has(collectionName)
      toggleExpand(collectionName)

      if (isExpanding && !collectionFiles[collectionName]) {
        setFilesLoading(collectionName, true)
        try {
          const files = await getCollectionFiles(collectionName)
          setCollectionFiles(collectionName, files)
        } catch (err) {
          toast.error(`Failed to load files for ${collectionName}`)
        } finally {
          setFilesLoading(collectionName, false)
        }
      }
    },
    [
      expandedCollections,
      toggleExpand,
      getCollectionFiles,
      collectionFiles,
      setCollectionFiles,
      setFilesLoading,
    ],
  )

  const handleUpdate = useCallback(
    async (collectionName: string) => {
      try {
        await onUpdateCollection(collectionName)
        // Clear files from state
        clearFileCache(collectionName)
        // Reload files if expanded
        if (expandedCollections.has(collectionName)) {
          setFilesLoading(collectionName, true)
          const files = await getCollectionFiles(collectionName)
          setCollectionFiles(collectionName, files)
          setFilesLoading(collectionName, false)
        }
      } catch (err) {
        toast.error(`Failed to update collection "${collectionName}"`)
      }
    },
    [
      onUpdateCollection,
      expandedCollections,
      getCollectionFiles,
      clearFileCache,
      setCollectionFiles,
      setFilesLoading,
    ],
  )

  return (
    <>
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="border-l bg-black/50"
      >
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Collections
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-amber-900/30"
              onClick={onCreateCollection}
              title="Create new collection"
            >
              <RiAddLine className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="">
              {collections.length}{' '}
              {collections.length === 1 ? 'Collection' : 'Collections'}
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {/* All Collections Option */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedCollection === null}
                  onClick={() => onSelectCollection(null)}
                  tooltip="All Collections"
                  className={cn(
                    'group/menu-button',
                    selectedCollection === null
                      ? 'bg-amber-500/80'
                      : 'hover:bg-amber-900/60',
                  )}
                >
                  <RiDatabase2Line className="h-4 w-4 shrink-0 group-data-[active=true]/menu-button:" />
                  <span className="truncate">All Collections</span>
                  {selectedCollection === null && (
                    <Badge
                      variant="secondary"
                      className="ml-auto shrink-0 bg-amber-500/20 text-xs"
                    >
                      Active
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Collection Items */}
              {isLoading ? (
                <div className="px-4 py-8 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                </div>
              ) : error ? (
                <div className="px-4 py-4 text-sm text-red-400">
                  Error: {error.message}
                </div>
              ) : collections.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm">No collections found</p>
                  <p className="mt-1 text-xs">
                    Create a collection to get started
                  </p>
                </div>
              ) : (
                collections.map((collection) => {
                  const isSelected = selectedCollection === collection.name
                  const isExpanded = expandedCollections.has(collection.name)
                  const files = collectionFiles[collection.name] || []
                  const isLoadingFiles = filesLoading[collection.name]

                  return (
                    <Collapsible
                      key={collection.name}
                      open={isExpanded}
                      onOpenChange={() => handleToggleExpand(collection.name)}
                    >
                      <SidebarMenuItem className="group/menu-item">
                        {/* Main Collection Row */}
                        <div className="flex items-center">
                          {/* Expand/Collapse Chevron */}
                          <CollapsibleTrigger
                            className={cn(
                              'h-6 w-6 shrink-0 p-0 hover:bg-amber-900/30 transition-transform duration-200 inline-flex items-center justify-center rounded-md',
                              isExpanded && 'rotate-90',
                            )}
                          >
                            <RiArrowRightSLine className="h-4 w-4" />
                            <span className="sr-only">
                              {isExpanded ? 'Collapse' : 'Expand'}{' '}
                              {collection.name}
                            </span>
                          </CollapsibleTrigger>

                          {/* Collection Name Button */}
                          <SidebarMenuButton
                            isActive={isSelected}
                            onClick={() => onSelectCollection(collection.name)}
                            tooltip={collection.name}
                            className={cn(
                              'flex-1 group/menu-button',
                              isSelected
                                ? 'bg-amber-500/10'
                                : 'hover:bg-amber-900/30',
                            )}
                          >
                            <RiFolderLine className="h-4 w-4 shrink-0 group-data-[active=true]/menu-button:" />
                            <span className="truncate">{collection.name}</span>
                            {files.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-auto shrink-0 bg-amber-900/30 text-[10px]"
                              >
                                {files.length}
                              </Badge>
                            )}
                          </SidebarMenuButton>

                          {/* Actions Menu */}
                          <CollectionMenu
                            collection={collection}
                            onUpdate={handleUpdate}
                          />
                        </div>

                        {/* Expanded Files List */}
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-l-amber-900/30">
                            {isLoadingFiles ? (
                              <div className="py-2 px-2 flex items-center gap-2">
                                <div className="h-3 w-3 animate-spin rounded-full border border-amber-600 border-t-transparent" />
                                <span className="text-xs">
                                  Loading files...
                                </span>
                              </div>
                            ) : files.length === 0 ? (
                              <div className="py-2 px-2 text-xs">
                                No files indexed
                              </div>
                            ) : (
                              <ScrollArea>
                                <div className="space-y-0.5">
                                  {files.map((file, idx) => {
                                    const fileFullPath = `qmd://${collection.name}/${file.path}`
                                    const isActive =
                                      selectedFilePath === fileFullPath
                                    return (
                                      <SidebarMenuSubItem
                                        key={`${file.path}-${idx}`}
                                      >
                                        <SidebarMenuSubButton
                                          className={cn(
                                            'cursor-pointer',
                                            isActive
                                              ? 'bg-amber-500 text-black'
                                              : 'hover:bg-amber-600',
                                          )}
                                          title={file.path}
                                          onClick={() => {
                                            // Use the file viewer store to open
                                            const { openFromCollection } =
                                              useFileViewerStore.getState()
                                            openFromCollection(
                                              file.path,
                                              collection.name,
                                            )
                                          }}
                                        >
                                          <RiFileTextLine
                                            className={cn(
                                              'text-neutral-700!',
                                              'h-3 w-3 shrink-0',
                                              isActive && 'text-white!',
                                            )}
                                          />
                                          <span
                                            className={cn(
                                              'truncate text-xs',
                                              isActive &&
                                                'text-amber-50 font-medium',
                                            )}
                                          >
                                            {file.title ||
                                              file.path.split('/').pop() ||
                                              file.path}
                                          </span>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )
                                  })}
                                </div>
                              </ScrollArea>
                            )}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex items-center justify-between">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-amber-900/30"
              onClick={() => {
                const themes: Array<'light' | 'dark' | 'system'> = [
                  'light',
                  'dark',
                  'system',
                ]
                const currentIndex = Math.max(
                  0,
                  themes.indexOf(theme as 'light' | 'dark' | 'system'),
                )
                const nextTheme = themes[(currentIndex + 1) % themes.length]
                setTheme(nextTheme!)
              }}
              title={`Theme: ${theme} (click to change)`}
            >
              {theme === 'light' && <RiSunLine className="h-4 w-4" />}
              {theme === 'dark' && <RiMoonLine className="h-4 w-4" />}
              {theme === 'system' && <RiComputerLine className="h-4 w-4" />}
            </Button>

            {/* Help Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-amber-900/30"
              onClick={() => setIsAppInfoOpen(true)}
              title="About & Shortcuts"
            >
              <RiQuestionLine className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <CollectionDialogs
        collections={collections}
        selectedCollection={selectedCollection}
        onSelectCollection={onSelectCollection}
        onDeleteCollection={onDeleteCollection}
        onRenameCollection={onRenameCollection}
      />

      <AppInfoModal open={isAppInfoOpen} onOpenChange={setIsAppInfoOpen} />
    </>
  )
}
