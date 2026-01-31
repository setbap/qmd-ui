'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RiAddLine,
  RiSubtractLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiFolderLine,
  RiFileTextLine,
} from '@remixicon/react'
import { cn } from '@/lib/utils'

// Collection type matching what the server returns (from YAML config)
interface Collection {
  name: string
  path: string
  pattern: string
  context?: Record<string, string>
  update?: string
  files?: string[]
}

interface CollectionPanelProps {
  collections: Collection[]
  selectedCollection: string | null
  onSelectCollection: (name: string | null) => void
  expandedCollections: Set<string>
  onToggleExpand: (name: string) => void
  onUpdateCollection: (name: string) => void
  onDeleteCollection: (name: string) => void
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
  isLoading = false,
  error = null,
}: CollectionPanelProps) {
  return (
    <div className={cn('flex h-full w-full flex-col border-l  ')}>
      {/* Header */}
      <div className="flex items-center justify-between border-b  px-4 py-3">
        <h2 className="text-sm font-medium text-amber-100">Collections</h2>
        <span className="text-xs text-amber-600">
          {collections.length} total
        </span>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-1" />
            </div>
          ) : error ? (
            <div className="px-4 py-4 text-sm text-red-400">
              Error: {error.message}
            </div>
          ) : collections.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-amber-700">No collections found</p>
              <p className="mt-1 text-xs text-amber-800">
                Create a collection to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* All Collections Option */}
              <button
                onClick={() => onSelectCollection(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left',
                  'transition-colors',
                  selectedCollection === null
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-amber-200 hover:bg-amber-900/20',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border',
                    selectedCollection === null
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-amber-700',
                  )}
                >
                  {selectedCollection === null && (
                    <div className="h-1.5 w-1.5 rounded-full" />
                  )}
                </div>
                <RiFolderLine className="h-4 w-4 text-amber-600" />
                <span className="text-sm">All Collections</span>
              </button>

              {/* Collection Items */}
              {collections.map((collection) => {
                const isSelected = selectedCollection === collection.name
                const isExpanded = expandedCollections.has(collection.name)

                return (
                  <Collapsible
                    key={collection.name}
                    open={isExpanded}
                    onOpenChange={() => onToggleExpand(collection.name)}
                  >
                    <div className="rounded-lg">
                      {/* Collection Row */}
                      <div className="flex items-center gap-1">
                        {/* Selection Radio */}
                        <button
                          onClick={() => onSelectCollection(collection.name)}
                          className={cn(
                            'flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left',
                            'transition-colors',
                            isSelected
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'text-amber-200 hover:bg-amber-900/20',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full border',
                              isSelected
                                ? 'border-amber-500 bg-amber-500'
                                : 'border-amber-700',
                            )}
                          >
                            {isSelected && (
                              <div className="h-1.5 w-1.5 rounded-full" />
                            )}
                          </div>
                          <RiFolderLine className="h-4 w-4 text-amber-600" />
                          <span className="truncate text-sm">
                            {collection.name}
                          </span>
                        </button>

                        {/* Expand/Collapse Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-900/30 hover:text-amber-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleExpand(collection.name)
                          }}
                        >
                          {isExpanded ? (
                            <RiSubtractLine className="h-4 w-4" />
                          ) : (
                            <RiAddLine className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded Content */}
                      <CollapsibleContent>
                        <div className="space-y-2 px-3 pb-3 pt-1">
                          {/* Collection Details */}
                           <div className="space-y-1 pl-6 text-xs">
                             <div className="flex items-start gap-1">
                               <span className="text-amber-700">Path:</span>
                               <span className="truncate text-amber-600">
                                 {collection.path}
                               </span>
                             </div>
                             <div className="flex items-start gap-1">
                               <span className="text-amber-700">Pattern:</span>
                               <span className="font-mono text-amber-600">
                                 {collection.pattern}
                               </span>
                             </div>
                           </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 pl-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onUpdateCollection(collection.name)
                              }
                              className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-900/30 hover:text-amber-400"
                            >
                              <RiRefreshLine className="mr-1 h-3 w-3" />
                              Update
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDeleteCollection(collection.name)
                              }
                              className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-900/30 hover:text-red-400"
                            >
                              <RiDeleteBinLine className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          </div>

                          {/* Files List */}
                          <div className="space-y-0.5 pl-6">
                            <div className="mb-1 text-xs font-medium text-amber-700">
                              Files:
                            </div>
                            {collection.files && collection.files.length > 0 ? (
                              <div className="max-h-32 space-y-0.5 overflow-y-auto">
                                {collection.files.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 text-xs text-amber-600"
                                  >
                                    <RiFileTextLine className="h-3 w-3 text-amber-800" />
                                    <span className="truncate">{file}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-amber-800">
                                No files indexed
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
