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
import {
  RiAddCircleLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiSettings3Line,
  RiSearchLine,
  RiSparklingLine,
  RiDatabase2Line,
} from '@remixicon/react'
import { Kbd } from '@/components/ui/kbd'

type CommandAction =
  | 'createCollection'
  | 'updateCollection'
  | 'deleteCollection'
  | 'embed'
  | 'settings'
  | 'search'
  | 'vsearch'
  | 'query'

interface CommandOption {
  id: string
  label: string
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
        label: 'Create Collection',
        action: 'createCollection',
        icon: <RiAddCircleLine className="size-4" />,
        // shortcut: '⌘N',
      },
      {
        id: 'update-collection',
        label: 'Update Collection',
        action: 'updateCollection',
        icon: <RiRefreshLine className="size-4" />,
      },
      {
        id: 'delete-collection',
        label: 'Delete Collection',
        action: 'deleteCollection',
        icon: <RiDeleteBinLine className="size-4" />,
      },
    ],
  },
  {
    heading: 'Search',
    commands: [
      {
        id: 'search',
        label: 'Text Search',
        action: 'search',
        icon: <RiSearchLine className="size-4" />,
        // shortcut: '⌘1',
      },
      {
        id: 'vsearch',
        label: 'Vector Search',
        action: 'vsearch',
        icon: <RiSparklingLine className="size-4" />,
        // shortcut: '⌘2',
      },
      {
        id: 'query',
        label: 'Hybrid Query',
        action: 'query',
        icon: <RiDatabase2Line className="size-4" />,
        // shortcut: '⌘3',
      },
    ],
  },
  {
    heading: 'Actions',
    commands: [
      {
        id: 'embed',
        label: 'Generate Embeddings',
        action: 'embed',
        icon: <RiSparklingLine className="size-4" />,
        // shortcut: '⌘E',
      },
    ],
  },
  {
    heading: 'Settings',
    commands: [
      {
        id: 'settings',
        label: 'Settings',
        action: 'settings',
        icon: <RiSettings3Line className="size-4" />,
        // shortcut: '⌘,',
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
      <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm ">
            No results found.
          </CommandEmpty>

          {commandGroups.map((group, groupIndex) => (
            <React.Fragment key={group.heading}>
              {groupIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => handleSelect(command.action)}
                  >
                    {command.icon}
                    <span>{command.label}</span>
                    {command.shortcut && (
                      <CommandShortcut>
                        <Kbd>{command.shortcut}</Kbd>
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
