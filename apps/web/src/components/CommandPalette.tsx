'use client'

import * as React from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  RiAddCircleLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiSettings3Line,
  RiSearchLine,
  RiSparklingLine,
  RiDatabase2Line,
  RiCommandLine,
} from '@remixicon/react'

type CommandAction =
  | 'createCollection'
  | 'updateCollection'
  | 'deleteCollection'
  | 'embed'
  | 'settings'
  | 'search'
  | 'vsearch'
  | 'query'
  | 'close'

interface CommandOption {
  id: string
  name: string
  description: string
  action: CommandAction
  icon: React.ReactNode
  shortcut?: string
}

const commandGroups: { heading: string; commands: CommandOption[] }[] = [
  {
    heading: 'Collections',
    commands: [
      {
        id: 'create-collection',
        name: 'Create Collection',
        description: 'Add a new collection with path and pattern',
        action: 'createCollection',
        icon: <RiAddCircleLine className="h-4 w-4" />,
        shortcut: 'Ctrl+N',
      },
      {
        id: 'update-collection',
        name: 'Update Collection',
        description: 'Re-index an existing collection',
        action: 'updateCollection',
        icon: <RiRefreshLine className="h-4 w-4" />,
      },
      {
        id: 'delete-collection',
        name: 'Delete Collection',
        description: 'Remove a collection from the index',
        action: 'deleteCollection',
        icon: <RiDeleteBinLine className="h-4 w-4" />,
      },
    ],
  },
  {
    heading: 'Search',
    commands: [
      {
        id: 'search',
        name: 'Text Search',
        description: 'BM25 full-text search',
        action: 'search',
        icon: <RiSearchLine className="h-4 w-4" />,
        shortcut: 'Ctrl+1',
      },
      {
        id: 'vsearch',
        name: 'Vector Search',
        description: 'Vector similarity search with embeddings',
        action: 'vsearch',
        icon: <RiSparklingLine className="h-4 w-4" />,
        shortcut: 'Ctrl+2',
      },
      {
        id: 'query',
        name: 'Hybrid Query',
        description: 'Hybrid search with reranking (best quality)',
        action: 'query',
        icon: <RiDatabase2Line className="h-4 w-4" />,
        shortcut: 'Ctrl+3',
      },
    ],
  },
  {
    heading: 'Actions',
    commands: [
      {
        id: 'embed',
        name: 'Generate Embeddings',
        description: 'Create vector embeddings for all collections',
        action: 'embed',
        icon: <RiSparklingLine className="h-4 w-4" />,
        shortcut: 'Ctrl+E',
      },
    ],
  },
  {
    heading: 'Settings',
    commands: [
      {
        id: 'settings',
        name: 'Settings',
        description: 'Configure app preferences',
        action: 'settings',
        icon: <RiSettings3Line className="h-4 w-4" />,
        shortcut: 'Ctrl+,',
      },
    ],
  },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: CommandAction) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onAction,
}: CommandPaletteProps) {
  const handleSelect = (action: CommandAction) => {
    onAction(action)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command
        className={cn(
          'rounded-lg border',
          '[&_[cmdk-group-heading]]:text-amber-600',
        )}
      >
        <CommandInput
          placeholder="Type a command or search..."
          className="border-0 bg-transparent text-amber-100 placeholder:text-amber-700"
        />
        <CommandList className="max-h-[60vh] overflow-y-auto">
          <CommandEmpty className="py-6 text-center text-sm text-amber-600">
            No commands found.
          </CommandEmpty>

          {commandGroups.map((group, groupIndex) => (
            <React.Fragment key={group.heading}>
              {groupIndex > 0 && (
                <CommandSeparator className="bg-amber-900/30" />
              )}
              <CommandGroup heading={group.heading}>
                {group.commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => handleSelect(command.action)}
                    className={cn(
                      'rounded-md text-amber-100',
                      'data-[selected=true]:bg-amber-900/30 data-[selected=true]:text-amber-50',
                      '[&_svg]:text-amber-600 data-[selected=true]:[&_svg]:text-amber-300',
                    )}
                  >
                    {command.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{command.name}</span>
                      <span className="text-xs text-amber-600">
                        {command.description}
                      </span>
                    </div>
                    {command.shortcut && (
                      <CommandShortcut className="text-amber-700">
                        <kbd className="rounded border bg-amber-950 px-1.5 py-0.5 font-mono text-xs">
                          {command.shortcut}
                        </kbd>
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}

          <CommandSeparator className="bg-amber-900/30" />
          <CommandGroup>
            <CommandItem
              onSelect={() => handleSelect('close')}
              className={cn(
                'rounded-md text-amber-100',
                'data-[selected=true]:bg-amber-900/30 data-[selected=true]:text-amber-50',
              )}
            >
              <RiCommandLine className="h-4 w-4 text-amber-600" />
              <span>Close Palette</span>
              <CommandShortcut className="text-amber-700">
                <kbd className="rounded border bg-amber-950 px-1.5 py-0.5 font-mono text-xs">
                  Esc
                </kbd>
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
