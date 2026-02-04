'use client'

import { useState, useCallback } from 'react'
import {
  RiFolderLine,
  RiFileTextLine,
  RiMoreLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
  RiArrowRightSLine,
  RiDatabase2Line,
  RiAddLine,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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
  expandedCollections: Set<string>
  onToggleExpand: (name: string) => void
  onUpdateCollection: (name: string) => Promise<void>
  onDeleteCollection: (name: string) => Promise<void>
  onRenameCollection: (oldName: string, newName: string) => Promise<void>
  onCreateCollection: () => void
  getCollectionFiles: (name: string) => Promise<FileInfo[]>
  onFileClick?: (path: string, collectionName: string) => void
  selectedFilePath?: string | null
  isLoading?: boolean
  error?: Error | null
}

export function CollectionPanel({
  collections,
  selectedCollection,
  onSelectCollection,
  expandedCollections,
  onToggleExpand,
  onUpdateCollection,
  onDeleteCollection,
  onRenameCollection,
  onCreateCollection,
  getCollectionFiles,
  onFileClick,
  selectedFilePath = null,
  isLoading = false,
  error = null,
}: CollectionPanelProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [collectionToRename, setCollectionToRename] = useState<string | null>(
    null,
  )
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // State for info dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [collectionToInfo, setCollectionToInfo] = useState<Collection | null>(
    null,
  )

  // State for collection files
  const [collectionFiles, setCollectionFiles] = useState<
    Record<string, FileInfo[]>
  >({})
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({})

  const handleToggleExpand = useCallback(
    async (collectionName: string) => {
      const isExpanding = !expandedCollections.has(collectionName)
      onToggleExpand(collectionName)

      if (isExpanding && !collectionFiles[collectionName]) {
        setLoadingFiles((prev) => ({ ...prev, [collectionName]: true }))
        try {
          const files = await getCollectionFiles(collectionName)
          setCollectionFiles((prev) => ({ ...prev, [collectionName]: files }))
        } catch (err) {
          toast.error(`Failed to load files for ${collectionName}`)
        } finally {
          setLoadingFiles((prev) => ({ ...prev, [collectionName]: false }))
        }
      }
    },
    [expandedCollections, onToggleExpand, getCollectionFiles, collectionFiles],
  )

  // Handle collection selection
  const handleSelectCollection = useCallback(
    (name: string | null) => {
      onSelectCollection(name)
    },
    [onSelectCollection],
  )

  // Handle update action
  const handleUpdate = useCallback(
    async (collectionName: string) => {
      try {
        await onUpdateCollection(collectionName)
        toast.success(`Collection "${collectionName}" updated successfully`)
        // Refresh files after update
        setCollectionFiles((prev) => {
          const next = { ...prev }
          delete next[collectionName]
          return next
        })
        // Reload files if expanded
        if (expandedCollections.has(collectionName)) {
          setLoadingFiles((prev) => ({ ...prev, [collectionName]: true }))
          const files = await getCollectionFiles(collectionName)
          setCollectionFiles((prev) => ({ ...prev, [collectionName]: files }))
          setLoadingFiles((prev) => ({ ...prev, [collectionName]: false }))
        }
      } catch (err) {
        toast.error(`Failed to update collection "${collectionName}"`)
      }
    },
    [onUpdateCollection, expandedCollections, getCollectionFiles],
  )

  // Handle delete action
  const handleDeleteClick = useCallback((collectionName: string) => {
    setCollectionToDelete(collectionName)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!collectionToDelete) return
    setIsDeleting(true)
    try {
      await onDeleteCollection(collectionToDelete)
      toast.success(`Collection "${collectionToDelete}" deleted`)
      // Clear files from state
      setCollectionFiles((prev) => {
        const next = { ...prev }
        delete next[collectionToDelete]
        return next
      })
      // If the deleted collection was selected, select all
      if (selectedCollection === collectionToDelete) {
        onSelectCollection(null)
      }
      setDeleteDialogOpen(false)
    } catch (err) {
      toast.error(`Failed to delete collection "${collectionToDelete}"`)
    } finally {
      setIsDeleting(false)
      setCollectionToDelete(null)
    }
  }, [
    collectionToDelete,
    onDeleteCollection,
    selectedCollection,
    onSelectCollection,
  ])

  // Handle rename action
  const handleRenameClick = useCallback((collectionName: string) => {
    setCollectionToRename(collectionName)
    setNewName(collectionName)
    setRenameDialogOpen(true)
  }, [])

  const handleConfirmRename = useCallback(async () => {
    if (
      !collectionToRename ||
      !newName.trim() ||
      newName === collectionToRename
    ) {
      setRenameDialogOpen(false)
      return
    }
    setIsRenaming(true)
    try {
      await onRenameCollection(collectionToRename, newName.trim())
      toast.success(
        `Collection renamed from "${collectionToRename}" to "${newName}"`,
      )
      // Update selected collection if it was the renamed one
      if (selectedCollection === collectionToRename) {
        onSelectCollection(newName.trim())
      }
      // Clear files from state (they'll be reloaded)
      setCollectionFiles((prev) => {
        const next = { ...prev }
        delete next[collectionToRename]
        return next
      })
      setRenameDialogOpen(false)
    } catch (err) {
      toast.error(`Failed to rename collection "${collectionToRename}"`)
    } finally {
      setIsRenaming(false)
      setCollectionToRename(null)
      setNewName('')
    }
  }, [
    collectionToRename,
    newName,
    onRenameCollection,
    selectedCollection,
    onSelectCollection,
  ])

  // Handle info action
  const handleInfoClick = useCallback((collection: Collection) => {
    setCollectionToInfo(collection)
    setInfoDialogOpen(true)
  }, [])

  // Get file count for a collection
  const getFileCount = useCallback(
    (collectionName: string) => {
      return collectionFiles[collectionName]?.length ?? 0
    },
    [collectionFiles],
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
            <h2 className="text-sm font-semibold tracking-wide  uppercase">
              Collections
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7  hover:bg-amber-900/30"
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
                  onClick={() => handleSelectCollection(null)}
                  tooltip="All Collections"
                  className={cn(
                    'group/menu-button',
                    selectedCollection === null
                      ? 'bg-amber-500/80 '
                      : ' hover:bg-amber-900/60 hover:',
                  )}
                >
                  <RiDatabase2Line className="h-4 w-4 shrink-0  group-data-[active=true]/menu-button:" />
                  <span className="truncate">All Collections</span>
                  {selectedCollection === null && (
                    <Badge
                      variant="secondary"
                      className="ml-auto shrink-0 bg-amber-500/20  text-xs"
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
                  <p className="text-sm ">No collections found</p>
                  <p className="mt-1 text-xs ">
                    Create a collection to get started
                  </p>
                </div>
              ) : (
                collections.map((collection) => {
                  const isSelected = selectedCollection === collection.name
                  const isExpanded = expandedCollections.has(collection.name)
                  const files = collectionFiles[collection.name] || []
                  const isLoadingFiles = loadingFiles[collection.name]

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
                              'h-6 w-6 shrink-0 p-0  hover:bg-amber-900/30 transition-transform duration-200 inline-flex items-center justify-center rounded-md',
                              isExpanded && 'rotate-90',
                            )}
                          >
                            <RiArrowRightSLine className="h-4 w-4" />
                            <span className="sr-only">
                              {isExpanded ? 'Collapse' : 'Expand'}{' '}
                              {collection.name}
                            </span>
                          </CollapsibleTrigger>

                          {/* Collection Name Button - Selects the collection */}
                          <SidebarMenuButton
                            isActive={isSelected}
                            onClick={() =>
                              handleSelectCollection(collection.name)
                            }
                            tooltip={collection.name}
                            className={cn(
                              'flex-1 group/menu-button',
                              isSelected
                                ? 'bg-amber-500/10 '
                                : ' hover:bg-amber-900/30 hover:',
                            )}
                          >
                            <RiFolderLine className="h-4 w-4 shrink-0  group-data-[active=true]/menu-button:" />
                            <span className="truncate">{collection.name}</span>
                            {files.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-auto shrink-0 bg-amber-900/30  text-[10px]"
                              >
                                {files.length}
                              </Badge>
                            )}
                          </SidebarMenuButton>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0  hover:bg-amber-900/30"
                              >
                                <RiMoreLine className="h-4 w-4" />
                                <span className="sr-only">
                                  Actions for {collection.name}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className="w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => handleUpdate(collection.name)}
                              >
                                <RiRefreshLine className="mr-2 h-4 w-4" />
                                Update (Re-index)
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleRenameClick(collection.name)
                                }
                              >
                                <RiEditLine className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleInfoClick(collection)}
                              >
                                <RiInformationLine className="mr-2 h-4 w-4" />
                                Info
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-amber-900/30" />

                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteClick(collection.name)
                                }
                                className="text-red-400 focus:bg-red-900/20 focus:text-red-300 cursor-pointer"
                              >
                                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Expanded Files List */}
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-l-amber-900/30">
                            {isLoadingFiles ? (
                              <div className="py-2 px-2 flex items-center gap-2">
                                <div className="h-3 w-3 animate-spin rounded-full border border-amber-600 border-t-transparent" />
                                <span className="text-xs ">
                                  Loading files...
                                </span>
                              </div>
                            ) : files.length === 0 ? (
                              <div className="py-2 px-2 text-xs ">
                                No files indexed
                              </div>
                            ) : (
                              <ScrollArea className={'pb-2'}>
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
                                        onClick={() =>
                                          onFileClick?.(
                                            file.path,
                                            collection.name,
                                          )
                                        }
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
          <div className="text-xs ">made by sina and ai</div>
        </SidebarFooter>
      </Sidebar>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="">Rename Collection</DialogTitle>
            <DialogDescription className="">
              Enter a new name for the collection.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="">
                Collection Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              className="border-amber-900/30  hover:bg-amber-900/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRename}
              disabled={
                isRenaming || !newName.trim() || newName === collectionToRename
              }
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">
              Delete Collection
            </DialogTitle>
            <DialogDescription className="">
              Are you sure you want to delete "{collectionToDelete}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-amber-900/30  hover:bg-amber-900/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 "
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className=" flex items-center gap-2">
              <RiFolderLine className="h-5 w-5 " />
              {collectionToInfo?.name}
            </DialogTitle>
            <DialogDescription className="">
              Collection details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className=" font-medium">Name:</span>
                <span className="">{collectionToInfo?.name}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className=" font-medium">Path:</span>
                <span className=" break-all">{collectionToInfo?.path}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className=" font-medium">Pattern:</span>
                <span className=" font-mono">{collectionToInfo?.pattern}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                <span className=" font-medium">Files:</span>
                <span className="">
                  {collectionToInfo?.name
                    ? getFileCount(collectionToInfo.name)
                    : 0}{' '}
                  files indexed
                </span>
              </div>
              {collectionToInfo?.update && (
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className=" font-medium">Auto-update:</span>
                  <span className="">{collectionToInfo.update}</span>
                </div>
              )}
              {collectionToInfo?.context &&
                Object.keys(collectionToInfo.context).length > 0 && (
                  <div className="space-y-2">
                    <span className=" font-medium text-sm">Context Paths:</span>
                    <div>
                      {Object.entries(collectionToInfo.context).map(
                        ([path, desc]) => (
                          <div key={path} className="text-xs">
                            <span className=" font-mono">{path}</span>
                            <span className=""> - {desc}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
