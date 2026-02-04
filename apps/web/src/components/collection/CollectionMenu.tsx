'use client'

import {
  RiRefreshLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
} from '@remixicon/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores'

interface Collection {
  name: string
  path: string
  pattern: string
  context?: Record<string, string>
  update?: string
}

interface CollectionMenuProps {
  collection: Collection
  onUpdate: (name: string) => Promise<void>
}

export function CollectionMenu({ collection, onUpdate }: CollectionMenuProps) {
  const { openRenameDialog, openDeleteDialog, openInfoDialog } = useUIStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 hover:bg-amber-900/30"
        >
          <span className="sr-only">Actions for {collection.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-48">
        <DropdownMenuItem onClick={() => onUpdate(collection.name)}>
          <RiRefreshLine className="mr-2 h-4 w-4" />
          Update (Re-index)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => openRenameDialog(collection.name)}>
          <RiEditLine className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => openInfoDialog(collection.name)}>
          <RiInformationLine className="mr-2 h-4 w-4" />
          Info
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-amber-900/30" />

        <DropdownMenuItem
          onClick={() => openDeleteDialog(collection.name)}
          className="text-red-400 focus:bg-red-900/20 focus:text-red-300 cursor-pointer"
        >
          <RiDeleteBinLine className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
