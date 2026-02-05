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
  RiChatQuoteLine,
} from '@remixicon/react'
import { Kbd } from '@/components/ui/kbd'

type CommandAction =
  | 'createCollection'
  | 'updateCollection'
  | 'deleteCollection'
  | 'addContext'
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
  disabled?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: CommandAction) => void
  selectedCollection: string | null
}

export function CommandPalette({
  open,
  onOpenChange,
  onAction,
  selectedCollection,
}: CommandPaletteProps) {
  const handleSelect = (action: CommandAction) => {
    onAction(action)
    onOpenChange(false)
  }

  // Build command groups dynamically based on selectedCollection
  const commandGroups: { heading: string; commands: CommandOption[] }[] = [
    {
      heading: 'Collections',
      commands: [
        {
          id: 'create-collection',
          label: 'Create Collection',
          action: 'createCollection',
          icon: <RiAddCircleLine className="size-4" />,
        },
        {
          id: 'update-collection',
          label: selectedCollection
            ? `Update Collection: ${selectedCollection}`
            : 'Update Collection',
          action: 'updateCollection',
          icon: <RiRefreshLine className="size-4" />,
          disabled: !selectedCollection,
        },
        {
          id: 'delete-collection',
          label: selectedCollection
            ? `Delete Collection: ${selectedCollection}`
            : 'Delete Collection',
          action: 'deleteCollection',
          icon: <RiDeleteBinLine className="size-4" />,
          disabled: !selectedCollection,
        },
        {
          id: 'add-context',
          label: selectedCollection
            ? `Add Context to: ${selectedCollection}`
            : 'Add Context to Collection',
          action: 'addContext',
          icon: <RiChatQuoteLine className="size-4" />,
          disabled: !selectedCollection,
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
        },
        {
          id: 'vsearch',
          label: 'Vector Search',
          action: 'vsearch',
          icon: <RiSparklingLine className="size-4" />,
        },
        {
          id: 'query',
          label: 'Hybrid Query',
          action: 'query',
          icon: <RiDatabase2Line className="size-4" />,
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
        },
      ],
    },
  ]

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
                    disabled={command.disabled}
                    className={
                      command.disabled
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : ''
                    }
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
