import { useState } from 'react'
import {
  RiHistoryLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiSparklingLine,
  RiDatabase2Line,
} from '@remixicon/react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useSearchStore, useUIStore, type SearchHistoryItem } from '@/stores'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'

const modeIcons = {
  search: RiSearchLine,
  vsearch: RiSparklingLine,
  query: RiDatabase2Line,
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function SearchHistoryButton() {
  const { openSearchHistory } = useUIStore()

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={openSearchHistory}
        >
          <RiHistoryLine className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <span>Search History</span>
          <Kbd>⌘H</Kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function SearchHistoryModal() {
  const { isSearchHistoryOpen, closeSearchHistory } = useUIStore()
  const {
    history,
    loadHistoryItem,
    executeSearch,
    removeFromHistory,
    clearHistory,
  } = useSearchStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = searchTerm
    ? history.filter(
        (item) =>
          item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.collection?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : history

  const handleSelect = async (item: SearchHistoryItem) => {
    loadHistoryItem(item)
    closeSearchHistory()
    await executeSearch()
  }

  return (
    <CommandDialog open={isSearchHistoryOpen} onOpenChange={closeSearchHistory}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Search history..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>No search history found.</CommandEmpty>
          <CommandGroup heading="Recent Searches">
            {filteredHistory.map((item) => {
              const ModeIcon = modeIcons[item.mode]
              return (
                <CommandItem
                  key={item.id + item.timestamp}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center group justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ModeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.query}</span>
                    {item.collection && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        in {item.collection}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </span>
                    <Button
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
                      }}
                    >
                      <RiCloseLine className="h-3 w-3" />
                    </Button>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
          {history.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={clearHistory}
                  className="text-destructive cursor-pointer"
                >
                  <RiDeleteBinLine className="mr-2 h-4 w-4" />
                  Clear All History
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
